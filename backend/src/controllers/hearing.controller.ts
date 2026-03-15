import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { createAuditLog } from '../middleware/auditLog';

export const createHearing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      caseId,
      title,
      hearingDate,
      courtRoom,
      judgeName,
      notes,
    } = req.body;

    if (!caseId || !title || !hearingDate) {
      return res.status(400).json({ error: 'Case ID, title, and hearing date are required' });
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

    const hearing = await prisma.hearing.create({
      data: {
        title,
        hearingDate: new Date(hearingDate),
        courtRoom,
        judgeName,
        notes,
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
      'Hearing',
      hearing.id,
      req.user.userId,
      `Created hearing: ${title}`,
      undefined,
      req
    );

    res.status(201).json(hearing);
  } catch (error) {
    console.error('Create hearing error:', error);
    res.status(500).json({ error: 'Failed to create hearing' });
  }
};

export const getHearings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { caseId, upcoming, page = '1', limit = '50' } = req.query;

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

    // Filter for upcoming hearings
    if (upcoming === 'true') {
      where.hearingDate = {
        gte: new Date(),
      };
    }

    const [hearings, total] = await Promise.all([
      prisma.hearing.findMany({
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
        orderBy: { hearingDate: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.hearing.count({ where }),
    ]);

    res.json({
      hearings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get hearings error:', error);
    res.status(500).json({ error: 'Failed to get hearings' });
  }
};

export const getHearingById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const hearing = await prisma.hearing.findFirst({
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

    if (!hearing) {
      return res.status(404).json({ error: 'Hearing not found' });
    }

    res.json(hearing);
  } catch (error) {
    console.error('Get hearing error:', error);
    res.status(500).json({ error: 'Failed to get hearing' });
  }
};

export const updateHearing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const {
      title,
      hearingDate,
      courtRoom,
      judgeName,
      notes,
      outcome,
      nextHearingDate,
    } = req.body;

    const hearing = await prisma.hearing.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
    });

    if (!hearing) {
      return res.status(404).json({ error: 'Hearing not found' });
    }

    const updated = await prisma.hearing.update({
      where: { id },
      data: {
        title,
        hearingDate: hearingDate ? new Date(hearingDate) : undefined,
        courtRoom,
        judgeName,
        notes,
        outcome,
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : undefined,
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
      'Hearing',
      id,
      req.user.userId,
      `Updated hearing: ${title}`,
      undefined,
      req
    );

    res.json(updated);
  } catch (error) {
    console.error('Update hearing error:', error);
    res.status(500).json({ error: 'Failed to update hearing' });
  }
};

export const deleteHearing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const hearing = await prisma.hearing.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
    });

    if (!hearing) {
      return res.status(404).json({ error: 'Hearing not found' });
    }

    await prisma.hearing.delete({ where: { id } });

    await createAuditLog(
      'DELETE',
      'Hearing',
      id,
      req.user.userId,
      `Deleted hearing: ${hearing.title}`,
      undefined,
      req
    );

    res.json({ message: 'Hearing deleted successfully' });
  } catch (error) {
    console.error('Delete hearing error:', error);
    res.status(500).json({ error: 'Failed to delete hearing' });
  }
};
