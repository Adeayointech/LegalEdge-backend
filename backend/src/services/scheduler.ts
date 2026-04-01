/**
 * Scheduled jobs for Lawravel
 *
 * Runs daily at 07:00 server time:
 *  - Deadline reminders: emails + in-app notifications for approaching deadlines
 *  - Hearing reminders:  emails + in-app notifications for upcoming hearings
 *  - Overdue detection:  mark deadlines as OVERDUE and notify assigned lawyers
 */

import cron from 'node-cron';
import prisma from '../lib/prisma';
import { createNotification } from './notification.service';
import { sendDeadlineReminder, sendHearingReminder } from '../utils/email';

// ── helpers ────────────────────────────────────────────────────────────────

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── deadline reminders ─────────────────────────────────────────────────────

async function processDeadlineReminders() {
  console.log('[SCHEDULER] Processing deadline reminders…');

  const deadlines = await prisma.deadline.findMany({
    where: {
      reminderEnabled: true,
      status: { not: 'COMPLETED' },
    },
    include: {
      case: {
        select: {
          id: true,
          title: true,
          suitNumber: true,
          firmId: true,
          assignedLawyers: {
            select: {
              lawyer: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const deadline of deadlines) {
    const days = daysUntil(deadline.dueDate);

    // Overdue: days < 0 and not yet MISSED status
    if (days < 0 && deadline.status !== 'MISSED') {
      await prisma.deadline.update({
        where: { id: deadline.id },
        data: { status: 'MISSED' },
      });

      for (const { lawyer } of deadline.case.assignedLawyers) {
        await createNotification({
          userId: lawyer.id,
          type: 'DEADLINE_OVERDUE',
          title: 'Deadline overdue',
          message: `"${deadline.title}" on case ${deadline.case.title} was due ${Math.abs(days)} day(s) ago.`,
          entityType: 'Deadline',
          entityId: deadline.id,
          sendEmail: true,
        });
        sent++;
      }
      continue;
    }

    // Upcoming: check if today matches one of the reminderDays values
    if (days >= 0 && (deadline.reminderDays as number[]).includes(days)) {
      for (const { lawyer } of deadline.case.assignedLawyers) {
        // In-app notification
        await createNotification({
          userId: lawyer.id,
          type: 'DEADLINE_REMINDER',
          title: days === 0 ? 'Deadline due today' : `Deadline in ${days} day${days === 1 ? '' : 's'}`,
          message: `"${deadline.title}" on case ${deadline.case.title} is due ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`,
          entityType: 'Deadline',
          entityId: deadline.id,
          sendEmail: false, // handled by sendDeadlineReminder below
        });

        // Rich deadline reminder email
        try {
          await sendDeadlineReminder(
            deadline as any,
            lawyer.email,
            `${lawyer.firstName} ${lawyer.lastName}`,
            days
          );
        } catch (err) {
          console.error(`[SCHEDULER] Failed to email deadline reminder to ${lawyer.email}:`, err);
        }
        sent++;
      }
    }
  }

  console.log(`[SCHEDULER] Deadline job complete — ${sent} reminder(s) sent.`);
}

// ── hearing reminders ──────────────────────────────────────────────────────

async function processHearingReminders() {
  console.log('[SCHEDULER] Processing hearing reminders…');

  const hearings = await prisma.hearing.findMany({
    where: {
      reminderEnabled: true,
      hearingDate: { gt: new Date() }, // only future hearings
    },
    include: {
      case: {
        select: {
          id: true,
          title: true,
          suitNumber: true,
          firmId: true,
          assignedLawyers: {
            select: {
              lawyer: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const hearing of hearings) {
    const days = daysUntil(hearing.hearingDate);

    if ((hearing.reminderDays as number[]).includes(days)) {
      for (const { lawyer } of hearing.case.assignedLawyers) {
        await createNotification({
          userId: lawyer.id,
          type: 'HEARING_REMINDER',
          title: days === 0 ? 'Hearing today' : `Hearing in ${days} day${days === 1 ? '' : 's'}`,
          message: `"${hearing.title}" for case ${hearing.case.title}${hearing.courtRoom ? ` in ${hearing.courtRoom}` : ''} is ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`,
          entityType: 'Hearing',
          entityId: hearing.id,
          sendEmail: false,
        });

        try {
          await sendHearingReminder(
            hearing as any,
            lawyer.email,
            `${lawyer.firstName} ${lawyer.lastName}`,
            days
          );
        } catch (err) {
          console.error(`[SCHEDULER] Failed to email hearing reminder to ${lawyer.email}:`, err);
        }
        sent++;
      }
    }
  }

  console.log(`[SCHEDULER] Hearing job complete — ${sent} reminder(s) sent.`);
}

// ── mount ──────────────────────────────────────────────────────────────────

export function startScheduler() {
  // Run daily at 07:00
  cron.schedule('0 7 * * *', async () => {
    console.log('[SCHEDULER] Daily reminder job triggered at', new Date().toISOString());
    try {
      await processDeadlineReminders();
      await processHearingReminders();
    } catch (err) {
      console.error('[SCHEDULER] Error during scheduled job:', err);
    }
  });

  console.log('[SCHEDULER] Scheduled — daily reminders will fire at 07:00.');
}
