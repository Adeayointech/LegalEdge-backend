import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { createAuditLog } from '../middleware/auditLog';

export const createDeadline = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      caseId,
      title,
      description,
      deadlineType,
      dueDate,
      reminderDays,
    } = req.body;

    if (!caseId || !title || !deadlineType || !dueDate) {
      return res.status(400).json({ error: 'Case ID, title, deadline type, and due date are required' });
    }

    // Verify case exists and user has access
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user.firmId!,
      },
    });

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const deadline = await prisma.deadline.create({
      data: {
        title,
        description,
        deadlineType,
        dueDate: new Date(dueDate),
        reminderEnabled: true,
        reminderDays: Array.isArray(reminderDays) ? reminderDays : [reminderDays || 3],
        caseId,
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            suitNumber: true,
          },
        },
      },
    });

    await createAuditLog(
      'CREATE',
      'Deadline',
      deadline.id,
      req.user.userId,
      `Created deadline: ${title}`,
      undefined,
      req
    );

    res.status(201).json(deadline);
  } catch (error) {
    console.error('Create deadline error:', error);
    res.status(500).json({ error: 'Failed to create deadline' });
  }
};

export const getDeadlines = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { caseId, status, upcoming, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      case: {
        firmId: req.user.firmId!,
      },
    };

    if (caseId) {
      where.caseId = caseId as string;
    }

    if (status) {
      where.status = status;
    }

    // Filter for upcoming deadlines (within next 30 days)
    if (upcoming === 'true') {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      where.dueDate = {
        gte: now,
        lte: thirtyDaysFromNow,
      };
      where.status = 'PENDING';
    }

    const [deadlines, total] = await Promise.all([
      prisma.deadline.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              title: true,
              suitNumber: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.deadline.count({ where }),
    ]);

    res.json({
      deadlines,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get deadlines error:', error);
    res.status(500).json({ error: 'Failed to get deadlines' });
  }
};

export const getDeadlineById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            suitNumber: true,
          },
        },
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    res.json(deadline);
  } catch (error) {
    console.error('Get deadline error:', error);
    res.status(500).json({ error: 'Failed to get deadline' });
  }
};

export const updateDeadline = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { title, description, deadlineType, dueDate, reminderDays, status } = req.body;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        title,
        description,
        deadlineType,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderDays: reminderDays ? (Array.isArray(reminderDays) ? reminderDays : [reminderDays]) : undefined,
        status,
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            suitNumber: true,
          },
        },
      },
    });

    await createAuditLog(
      'UPDATE',
      'Deadline',
      id,
      req.user.userId,
      `Updated deadline: ${title}`,
      undefined,
      req
    );

    res.json(updated);
  } catch (error) {
    console.error('Update deadline error:', error);
    res.status(500).json({ error: 'Failed to update deadline' });
  }
};

export const markDeadlineComplete = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    await createAuditLog(
      'UPDATE',
      'Deadline',
      id,
      req.user.userId,
      'Marked deadline as completed',
      undefined,
      req
    );

    res.json(updated);
  } catch (error) {
    console.error('Mark deadline complete error:', error);
    res.status(500).json({ error: 'Failed to mark deadline as complete' });
  }
};

export const deleteDeadline = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    await prisma.deadline.delete({ where: { id } });

    await createAuditLog(
      'DELETE',
      'Deadline',
      id,
      req.user.userId,
      `Deleted deadline: ${deadline.title}`,
      undefined,
      req
    );

    res.json({ message: 'Deadline deleted successfully' });
  } catch (error) {
    console.error('Delete deadline error:', error);
    res.status(500).json({ error: 'Failed to delete deadline' });
  }
};

export const getDeadlineStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const where: any = {
      case: {
        firmId: req.user.firmId!,
      },
    };

    const [total, pending, completed, missed, upcoming] = await Promise.all([
      prisma.deadline.count({ where }),
      prisma.deadline.count({ where: { ...where, status: 'PENDING' } }),
      prisma.deadline.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.deadline.count({ where: { ...where, status: 'MISSED' } }),
      prisma.deadline.count({
        where: {
          ...where,
          status: 'PENDING',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
    ]);

    res.json({
      total,
      pending,
      completed,
      missed,
      upcoming,
    });
  } catch (error) {
    console.error('Get deadline stats error:', error);
    res.status(500).json({ error: 'Failed to fetch deadline statistics' });
  }
};
