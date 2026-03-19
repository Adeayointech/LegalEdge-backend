import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      action,
      entityType,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const where: any = {};

    // Filter by action
    if (action) {
      where.action = action as string;
    }

    // Filter by entity type
    if (entityType) {
      where.entityType = entityType as string;
    }

    // Filter by user
    if (userId) {
      where.userId = userId as string;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Only show logs for the user's firm (unless PLATFORM_ADMIN)
    if (req.user.role !== 'PLATFORM_ADMIN') {
      // Get user's firmId
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { firmId: true },
      });

      if (user?.firmId) {
        // Filter logs to only show those from users in the same firm
        where.user = {
          firmId: user.firmId,
        };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          case: {
            select: {
              id: true,
              title: true,
              suitNumber: true,
            },
          },
          document: {
            select: {
              id: true,
              title: true,
              fileName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        case: {
          select: {
            id: true,
            title: true,
            suitNumber: true,
          },
        },
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            documentType: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

export const getAuditLogStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const [totalLogs, byAction, byEntityType, recentActivity] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: true,
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    res.json({
      totalLogs,
      byAction,
      byEntityType,
      recentActivity,
    });
  } catch (error) {
    console.error('Get audit log stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log statistics' });
  }
};
