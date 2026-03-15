import cron from 'node-cron';
import prisma from '../lib/prisma';
import { sendDeadlineReminder, sendHearingReminder } from './email';
import { sendDeadlineReminderSMS, sendOverdueDeadlineSMS, sendHearingReminderSMS } from './sms';
import { createNotification } from '../services/notification.service';
import { NotificationType } from '@prisma/client';

// Run every day at 8 AM
const scheduleDeadlineReminders = () => {
  // Check for deadlines and send reminders every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running deadline reminder check...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      // Find pending deadlines in the next 3 days
      const upcomingDeadlines = await prisma.deadline.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: threeDaysFromNow,
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
  });

  console.log('Deadline reminder scheduler initialized (runs daily at 8:00 AM)');
};

// Also check for overdue deadlines every day at 9 AM
const scheduleOverdueAlerts = () => {
  cron.schedule('0 9 * * *', async () => {
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
  });

  console.log('Overdue deadline scheduler initialized (runs daily at 9:00 AM)');
};

// Schedule hearing reminders - runs every day at 7:30 AM
const scheduleHearingReminders = () => {
  cron.schedule('30 7 * * *', async () => {
    console.log('Running hearing reminder check...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      // Find upcoming hearings in the next 3 days
      const upcomingHearings = await prisma.hearing.findMany({
        where: {
          hearingDate: {
            gte: now,
            lte: threeDaysFromNow,
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
  });

  console.log('Hearing reminder scheduler initialized (runs daily at 7:30 AM)');
};

export const initializeSchedulers = () => {
  scheduleDeadlineReminders();
  scheduleOverdueAlerts();
  scheduleHearingReminders();
};
