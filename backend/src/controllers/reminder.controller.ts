import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendDeadlineReminder } from '../utils/email';

export const sendTestReminder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { deadlineId } = req.params;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id: deadlineId,
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

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    const now = new Date();
    const daysUntilDue = Math.ceil(
      (new Date(deadline.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send to all assigned lawyers
    const results = [];
    for (const assignment of deadline.case.assignedLawyers) {
      const lawyer = assignment.lawyer;
      try {
        const sent = await sendDeadlineReminder(
          deadline as any,
          lawyer.email,
          `${lawyer.firstName} ${lawyer.lastName}`,
          daysUntilDue
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
    console.error('Test reminder error:', error);
    res.status(500).json({ 
      error: 'Failed to send test reminder',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateReminderSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { deadlineId } = req.params;
    const { reminderEnabled, reminderDays } = req.body;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id: deadlineId,
        case: { firmId: req.user.firmId! },
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    const updated = await prisma.deadline.update({
      where: { id: deadlineId },
      data: {
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : deadline.reminderEnabled,
        reminderDays: reminderDays || deadline.reminderDays,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update reminder settings error:', error);
    res.status(500).json({ error: 'Failed to update reminder settings' });
  }
};
