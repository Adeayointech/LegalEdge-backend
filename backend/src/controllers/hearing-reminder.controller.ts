import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendHearingReminder } from '../utils/email';

export const sendTestHearingReminder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { hearingId } = req.params;

    const hearing = await prisma.hearing.findFirst({
      where: {
        id: hearingId,
        case: { firmId: req.user.firmId! },
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            suitNumber: true,
            assignedLawyers: {
              select: {
                lawyer: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!hearing) {
      return res.status(404).json({ error: 'Hearing not found' });
    }

    const now = new Date();
    const daysUntilHearing = Math.ceil(
      (new Date(hearing.hearingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send to all assigned lawyers
    const results = [];
    for (const assignment of hearing.case.assignedLawyers) {
      const lawyer = assignment.lawyer;
      try {
        const sent = await sendHearingReminder(
          lawyer.email,
          `${lawyer.firstName} ${lawyer.lastName}`,
          {
            title: hearing.title,
            hearingDate: hearing.hearingDate,
            courtRoom: hearing.courtRoom || 'TBD',
            judgeName: hearing.judgeName || 'TBD',
            caseTitle: hearing.case.title,
            suitNumber: hearing.case.suitNumber,
          },
          daysUntilHearing
        );
        results.push({ email: lawyer.email, sent });
      } catch (emailError) {
        console.error(`Failed to send reminder to ${lawyer.email}:`, emailError);
        results.push({ email: lawyer.email, sent: false, error: String(emailError) });
      }
    }

    res.json({
      message: 'Test reminders sent',
      results,
    });
  } catch (error) {
    console.error('Test hearing reminder error:', error);
    res.status(500).json({ 
      error: 'Failed to send test hearing reminder',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateHearingReminderSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { hearingId } = req.params;
    const { reminderEnabled, reminderDays } = req.body;

    const hearing = await prisma.hearing.findFirst({
      where: {
        id: hearingId,
        case: { firmId: req.user.firmId! },
      },
    });

    if (!hearing) {
      return res.status(404).json({ error: 'Hearing not found' });
    }

    const updated = await prisma.hearing.update({
      where: { id: hearingId },
      data: {
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : hearing.reminderEnabled,
        reminderDays: reminderDays || hearing.reminderDays,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update hearing reminder settings error:', error);
    res.status(500).json({ error: 'Failed to update hearing reminder settings' });
  }
};
