import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

/**
 * GET /api/calendar/events?year=YYYY&month=MM
 * Returns hearings and deadlines for the firm within the requested month.
 * Also accepts year/month range queries: ?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const firmId = req.user.firmId;
    if (!firmId) return res.status(403).json({ error: 'No firm associated with this account' });

    // Build date range
    let start: Date;
    let end: Date;

    if (req.query.start && req.query.end) {
      start = new Date(req.query.start as string);
      end = new Date(req.query.end as string);
    } else {
      const year = parseInt((req.query.year as string) ?? String(new Date().getFullYear()), 10);
      const month = parseInt((req.query.month as string) ?? String(new Date().getMonth() + 1), 10);
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59); // last day of month
    }

    // Fetch hearings scoped to firm's cases
    const hearings = await prisma.hearing.findMany({
      where: {
        hearingDate: { gte: start, lte: end },
        case: { firmId },
      },
      select: {
        id: true,
        title: true,
        hearingDate: true,
        courtRoom: true,
        judgeName: true,
        case: { select: { id: true, title: true, suitNumber: true } },
      },
      orderBy: { hearingDate: 'asc' },
    });

    // Fetch deadlines scoped to firm's cases
    const deadlines = await prisma.deadline.findMany({
      where: {
        dueDate: { gte: start, lte: end },
        status: { not: 'COMPLETED' },
        case: { firmId },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        deadlineType: true,
        status: true,
        case: { select: { id: true, title: true, suitNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const events = [
      ...hearings.map((h) => ({
        id: h.id,
        type: 'hearing' as const,
        title: h.title,
        date: h.hearingDate,
        meta: {
          courtRoom: h.courtRoom,
          judgeName: h.judgeName,
        },
        case: h.case,
      })),
      ...deadlines.map((d) => ({
        id: d.id,
        type: 'deadline' as const,
        title: d.title,
        date: d.dueDate,
        meta: {
          deadlineType: d.deadlineType,
          status: d.status,
        },
        case: d.case,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ events, start, end });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};
