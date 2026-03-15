import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate, branchId } = req.query;

    const baseFirmFilter: any = { firmId: req.user.firmId! };
    if (branchId) {
      baseFirmFilter.branchId = branchId as string;
    }

    // Date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Case Statistics by Status
    const casesByStatus = await prisma.case.groupBy({
      by: ['status'],
      where: baseFirmFilter,
      _count: true,
    });

    // Case Statistics by Type
    const casesByType = await prisma.case.groupBy({
      by: ['caseType'],
      where: baseFirmFilter,
      _count: true,
    });

    // Cases over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const casesOverTime = branchId 
      ? await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM cases
          WHERE "firmId" = ${req.user.firmId}
            AND "createdAt" >= ${twelveMonthsAgo}
            AND "branchId" = ${branchId}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `
      : await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM cases
          WHERE "firmId" = ${req.user.firmId}
            AND "createdAt" >= ${twelveMonthsAgo}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `;

    // Document Statistics
    const documentsByType = await prisma.document.groupBy({
      by: ['documentType'],
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
      },
      _count: true,
    });

    const documentsByStatus = await prisma.document.groupBy({
      by: ['status'],
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
      },
      _count: true,
    });

    // Documents over time (last 12 months)
    const documentsOverTime = branchId
      ? await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', d."createdAt"), 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM documents d
          INNER JOIN cases c ON d."caseId" = c.id
          WHERE c."firmId" = ${req.user.firmId}
            AND d."createdAt" >= ${twelveMonthsAgo}
            AND c."branchId" = ${branchId}
          GROUP BY DATE_TRUNC('month', d."createdAt")
          ORDER BY month ASC
        `
      : await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', d."createdAt"), 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM documents d
          INNER JOIN cases c ON d."caseId" = c.id
          WHERE c."firmId" = ${req.user.firmId}
            AND d."createdAt" >= ${twelveMonthsAgo}
          GROUP BY DATE_TRUNC('month', d."createdAt")
          ORDER BY month ASC
        `;

    // Deadline Statistics
    const deadlinesByStatus = await prisma.deadline.groupBy({
      by: ['status'],
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
      },
      _count: true,
    });

    // Deadline compliance - overdue vs completed on time
    const now = new Date();
    const overdueDeadlines = await prisma.deadline.count({
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
        status: 'PENDING',
        dueDate: { lt: now },
      },
    });

    // Get completed deadlines to calculate on-time vs late
    const completedDeadlines = await prisma.deadline.findMany({
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
        status: 'COMPLETED',
        completedDate: { not: null },
      },
      select: {
        dueDate: true,
        completedDate: true,
      },
    });

    let completedOnTime = 0;
    let completedLate = 0;
    
    for (const deadline of completedDeadlines) {
      if (deadline.completedDate && deadline.completedDate <= deadline.dueDate) {
        completedOnTime++;
      } else if (deadline.completedDate && deadline.completedDate > deadline.dueDate) {
        completedLate++;
      }
    }

    const totalCompleted = completedOnTime + completedLate;
    const complianceRate = totalCompleted > 0 
      ? ((completedOnTime / totalCompleted) * 100).toFixed(2)
      : 0;

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlines = await prisma.deadline.count({
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
        status: 'PENDING',
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });

    // Hearing Statistics
    const hearingsByOutcome = await prisma.hearing.groupBy({
      by: ['outcome'],
      where: {
        case: {
          firmId: req.user.firmId!,
          ...(branchId ? { branchId: branchId as string } : {}),
        },
        outcome: { not: null },
      },
      _count: true,
    });

    // Average case duration (for closed cases)
    const closedCases = await prisma.case.findMany({
      where: {
        ...baseFirmFilter,
        status: { in: ['CLOSED', 'ARCHIVED'] },
        filingDate: { not: null },
      },
      select: {
        filingDate: true,
        updatedAt: true,
      },
    });

    let avgCaseDuration = 0;
    if (closedCases.length > 0) {
      const totalDays = closedCases.reduce((sum, c) => {
        const start = new Date(c.filingDate!);
        const end = new Date(c.updatedAt);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgCaseDuration = Math.floor(totalDays / closedCases.length);
    }

    // Branch statistics (if no specific branch filter)
    let branchStats: any[] = [];
    if (!branchId) {
      branchStats = await prisma.branch.findMany({
        where: {
          firmId: req.user.firmId!,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              cases: true,
              users: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return res.json({
      cases: {
        byStatus: casesByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        byType: casesByType.map(item => ({
          type: item.caseType,
          count: item._count,
        })),
        overTime: casesOverTime.map(item => ({
          month: item.month,
          count: Number(item.count),
        })),
        avgDuration: avgCaseDuration,
      },
      documents: {
        byType: documentsByType.map(item => ({
          type: item.documentType,
          count: item._count,
        })),
        byStatus: documentsByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        overTime: documentsOverTime.map(item => ({
          month: item.month,
          count: Number(item.count),
        })),
      },
      deadlines: {
        byStatus: deadlinesByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        overdue: overdueDeadlines,
        upcoming: upcomingDeadlines,
        completedOnTime,
        completedLate,
        complianceRate,
      },
      hearings: {
        byOutcome: hearingsByOutcome.map(item => ({
          outcome: item.outcome,
          count: item._count,
        })),
      },
      branches: branchStats,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
