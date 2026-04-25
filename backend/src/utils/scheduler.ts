import cron from 'node-cron';
import prisma from '../lib/prisma';
import { sendDeadlineReminder, sendHearingReminder } from './email';
import { sendDeadlineReminderSMS, sendOverdueDeadlineSMS, sendHearingReminderSMS } from './sms';
import { createNotification } from '../services/notification.service';
import { NotificationType } from '@prisma/client';

// Exported so they can be triggered manually (e.g. for testing)
export const runDeadlineReminders = async () => {
    console.log('Running deadline reminder check...');
    
    try {
      const now = new Date();
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(now.getDate() + 14);

      // Find pending deadlines in the next 14 days (covers all reminderDays values)
      const upcomingDeadlines = await prisma.deadline.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: fourteenDaysFromNow,
          },
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              suitNumber: true,
              assignedLawyers: {
                include: {
                  lawyer: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(`Found ${upcomingDeadlines.length} upcoming deadlines`);

      for (const deadline of upcomingDeadlines) {
        const daysUntilDue = Math.ceil(
          (new Date(deadline.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if reminders are enabled and if we should send for this day
        const shouldSendReminder = 
          deadline.reminderEnabled &&
          deadline.reminderDays &&
          Array.isArray(deadline.reminderDays) &&
          deadline.reminderDays.includes(daysUntilDue);

        if (shouldSendReminder) {
          // Send to all assigned lawyers on the case
          for (const assignment of deadline.case.assignedLawyers) {
            const lawyer = assignment.lawyer;
            const lawyerName = `${lawyer.firstName} ${lawyer.lastName}`;
            
            // Create notification in database
            const urgencyLabel = daysUntilDue === 0 ? '🚨 TODAY' : daysUntilDue === 1 ? '⚠️ TOMORROW' : `📅 ${daysUntilDue} days`;
            await createNotification({
              userId: lawyer.id,
              type: NotificationType.DEADLINE_REMINDER,
              title: `${urgencyLabel}: ${deadline.title}`,
              message: `Deadline "${deadline.title}" for case "${deadline.case.title}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Please take necessary action.`,
              entityType: 'Deadline',
              entityId: deadline.id,
              sendEmail: true,
            });
            
            // Send email reminder
            await sendDeadlineReminder(
              deadline as any,
              lawyer.email,
              lawyerName,
              daysUntilDue
            );

            // Send SMS for urgent deadlines (24 hours or less) if phone is available
            if (lawyer.phone && daysUntilDue <= 1) {
              const hoursUntilDue = Math.ceil(
                (new Date(deadline.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60)
              );
              await sendDeadlineReminderSMS(
                lawyer.phone,
                lawyerName,
                deadline.title,
                deadline.case.title,
                hoursUntilDue
              );
            }
          }
        }
      }

      console.log('Deadline reminder check completed');
    } catch (error) {
      console.error('Error in deadline reminder cron job:', error);
    }
};

// Run every day at 8 AM
const scheduleDeadlineReminders = () => {
  cron.schedule('0 8 * * *', runDeadlineReminders);
  console.log('Deadline reminder scheduler initialized (runs daily at 8:00 AM)');
};

export const runOverdueAlerts = async () => {
    console.log('Running overdue deadline check...');
    
    try {
      const now = new Date();

      // Find overdue deadlines
      const overdueDeadlines = await prisma.deadline.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: now,
          },
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              suitNumber: true,
              assignedLawyers: {
                include: {
                  lawyer: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(`Found ${overdueDeadlines.length} overdue deadlines`);

      for (const deadline of overdueDeadlines) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(deadline.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Mark status as MISSED in DB
        await prisma.deadline.update({
          where: { id: deadline.id },
          data: { status: 'MISSED' },
        });

        // Send overdue alert
        for (const assignment of deadline.case.assignedLawyers) {
          const lawyer = assignment.lawyer;
          const lawyerName = `${lawyer.firstName} ${lawyer.lastName}`;
          
          // Create overdue notification
          await createNotification({
            userId: lawyer.id,
            type: NotificationType.DEADLINE_OVERDUE,
            title: `🚨 OVERDUE: ${deadline.title}`,
            message: `Deadline "${deadline.title}" for case "${deadline.case.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue! Immediate action required.`,
            entityType: 'Deadline',
            entityId: deadline.id,
            sendEmail: true,
          });
          
          // Send email alert
          await sendDeadlineReminder(
            deadline as any,
            lawyer.email,
            lawyerName,
            -daysOverdue // Negative to indicate overdue
          );

          // Send SMS alert if phone is available
          if (lawyer.phone) {
            await sendOverdueDeadlineSMS(
              lawyer.phone,
              lawyerName,
              deadline.title,
              deadline.case.title
            );
          }
        }
      }

      console.log('Overdue deadline check completed');
    } catch (error) {
      console.error('Error in overdue deadline cron job:', error);
    }
};

// Also check for overdue deadlines every day at 9 AM
const scheduleOverdueAlerts = () => {
  cron.schedule('0 9 * * *', runOverdueAlerts);
  console.log('Overdue deadline scheduler initialized (runs daily at 9:00 AM)');
};

export const runHearingReminders = async () => {
    console.log('Running hearing reminder check...');
    
    try {
      const now = new Date();
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(now.getDate() + 14);

      // Find upcoming hearings in the next 14 days (covers all reminderDays values)
      const upcomingHearings = await prisma.hearing.findMany({
        where: {
          hearingDate: {
            gte: now,
            lte: fourteenDaysFromNow,
          },
          outcome: null, // Only hearings that haven't occurred yet
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              suitNumber: true,
              assignedLawyers: {
                include: {
                  lawyer: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(`Found ${upcomingHearings.length} upcoming hearings`);

      for (const hearing of upcomingHearings) {
        const daysUntilHearing = Math.ceil(
          (new Date(hearing.hearingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if reminders are enabled and if we should send for this day
        const shouldSendReminder = 
          hearing.reminderEnabled &&
          hearing.reminderDays &&
          Array.isArray(hearing.reminderDays) &&
          hearing.reminderDays.includes(daysUntilHearing);

        if (shouldSendReminder) {
          // Send to all assigned lawyers on the case
          for (const assignment of hearing.case.assignedLawyers) {
            const lawyer = assignment.lawyer;
            const lawyerName = `${lawyer.firstName} ${lawyer.lastName}`;

            // In-app notification
            const urgencyLabel = daysUntilHearing === 0 ? '🚨 TODAY' : daysUntilHearing === 1 ? '⚠️ TOMORROW' : `📅 ${daysUntilHearing} days`;
            await createNotification({
              userId: lawyer.id,
              type: NotificationType.HEARING_REMINDER,
              title: `${urgencyLabel}: ${hearing.title}`,
              message: `Hearing "${hearing.title}" for case "${hearing.case.title}" is ${daysUntilHearing === 0 ? 'today' : `in ${daysUntilHearing} day${daysUntilHearing !== 1 ? 's' : ''}`}${hearing.courtRoom ? ` — ${hearing.courtRoom}` : ''}.`,
              entityType: 'Hearing',
              entityId: hearing.id,
              sendEmail: false,
            });
            
            // Send email reminder
            await sendHearingReminder(
              hearing as any,
              lawyer.email,
              lawyerName,
              daysUntilHearing
            );

            // Send SMS for urgent hearings (24 hours or less) if phone is available
            if (lawyer.phone && daysUntilHearing <= 1) {
              const hoursUntilHearing = Math.ceil(
                (new Date(hearing.hearingDate).getTime() - now.getTime()) / (1000 * 60 * 60)
              );
              await sendHearingReminderSMS(
                lawyer.phone,
                lawyerName,
                hearing.title,
                hearing.case.title,
                hoursUntilHearing
              );
            }
          }
        }
      }

      console.log('Hearing reminder check completed');
    } catch (error) {
      console.error('Error in hearing reminder cron job:', error);
    }
};

// Schedule hearing reminders - runs every day at 7:30 AM
const scheduleHearingReminders = () => {
  cron.schedule('30 7 * * *', runHearingReminders);
  console.log('Hearing reminder scheduler initialized (runs daily at 7:30 AM)');
};

export const initializeSchedulers = () => {
  scheduleDeadlineReminders();
  scheduleOverdueAlerts();
  scheduleHearingReminders();
  scheduleSubscriptionChecks();
};

// Run every day at 6 AM — check trial/subscription expiry
const scheduleSubscriptionChecks = () => {
  cron.schedule('0 6 * * *', async () => {
    console.log('Running subscription expiry check...');
    const now = new Date();

    try {
      // 1. TRIAL firms whose trial has ended → move to GRACE_PERIOD
      const expiredTrials = await prisma.firm.findMany({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: { lt: now },
        },
        select: { id: true, name: true, email: true },
      });

      for (const firm of expiredTrials) {
        const gracePeriodEndsAt = new Date(now);
        gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7);
        await prisma.firm.update({
          where: { id: firm.id },
          data: { subscriptionStatus: 'GRACE_PERIOD', gracePeriodEndsAt },
        });
        console.log(`[SUBSCRIPTION] Trial expired for firm: ${firm.name} — grace period started`);
      }

      // 2. ACTIVE subscriptions that have ended → move to GRACE_PERIOD
      const expiredSubscriptions = await prisma.firm.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: { lt: now },
        },
        select: { id: true, name: true },
      });

      for (const firm of expiredSubscriptions) {
        const gracePeriodEndsAt = new Date(now);
        gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7);
        await prisma.firm.update({
          where: { id: firm.id },
          data: { subscriptionStatus: 'GRACE_PERIOD', gracePeriodEndsAt },
        });
        console.log(`[SUBSCRIPTION] Subscription expired for firm: ${firm.name} — grace period started`);
      }

      // 3. GRACE_PERIOD firms whose grace has ended → EXPIRED (full lock out)
      const expiredGrace = await prisma.firm.findMany({
        where: {
          subscriptionStatus: 'GRACE_PERIOD',
          gracePeriodEndsAt: { lt: now },
        },
        select: { id: true, name: true },
      });

      for (const firm of expiredGrace) {
        await prisma.firm.update({
          where: { id: firm.id },
          data: { subscriptionStatus: 'EXPIRED' },
        });
        console.log(`[SUBSCRIPTION] Grace period ended for firm: ${firm.name} — LOCKED OUT`);
      }

    } catch (error) {
      console.error('Error in subscription check cron job:', error);
    }
  });

  console.log('Subscription check scheduler initialized (runs daily at 6:00 AM)');
};
