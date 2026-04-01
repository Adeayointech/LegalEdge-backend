import { Response } from 'express';
import { CaseType, CaseStatus, NotificationType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';
import { sendCaseAssignmentEmail } from '../utils/email';
import { sendCaseAssignmentSMS } from '../utils/sms';
import { createNotification } from '../services/notification.service';

export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.firmId) {
      return res.status(400).json({ error: 'You must set up your law firm first. Please contact admin or set up firm in settings.' });
    }

    const {
      title,
      suitNumber,
      caseType,
      status,
      courtName,
      courtLevel,
      courtLocation,
      judgeName,
      plaintiff,
      defendant,
      opposingCounsel,
      description,
      clientId,
      branchId,
      assignedLawyerIds,
      filingDate,
    } = req.body;

    if (!title || !caseType || !clientId) {
      return res.status(400).json({ error: 'Title, case type, and client are required' });
    }

    // Verify client exists and belongs to user's firm
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        firmId: req.user.firmId,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create case
    const newCase = await prisma.case.create({
      data: {
        title,
        suitNumber,
        caseType: caseType as CaseType,
        status: status || CaseStatus.PRE_TRIAL,
        courtName,
        courtLevel,
        courtLocation,
        judgeName,
        plaintiff,
        defendant,
        opposingCounsel,
        description,
        clientId,
        firmId: req.user.firmId,
        branchId: branchId || req.user.branchId,
        createdById: req.user.userId,
        filingDate: filingDate ? new Date(filingDate) : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Assign lawyers if provided
    if (assignedLawyerIds && Array.isArray(assignedLawyerIds)) {
      await Promise.all(
        assignedLawyerIds.map((lawyerId: string) =>
          prisma.caseLawyer.create({
            data: {
              caseId: newCase.id,
              lawyerId,
            },
          })
        )
      );
    }

    await createAuditLog('CREATE', 'Case', newCase.id, req.user.userId, `Created case: ${title}`, undefined, req);

    res.status(201).json(newCase);
  } catch (error: any) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
};

export const getCases = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status, caseType, clientId, search, branchId, assignedToMe, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      firmId: req.user.firmId,
    };

    // Filter for cases assigned to the current user
    if (assignedToMe === 'true') {
      where.assignedLawyers = {
        some: {
          lawyerId: req.user.userId,
        },
      };
    }

    // Filter by branch from query parameter (for branch selector)
    if (branchId) {
      where.branchId = branchId as string;
    }
    // Otherwise, filter by user's branch if not HQ/admin
    else if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SENIOR_PARTNER') {
      where.branchId = req.user.branchId;
    }

    if (status) {
      where.status = status;
    }

    if (caseType) {
      where.caseType = caseType;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { suitNumber: { contains: search as string, mode: 'insensitive' } },
        { plaintiff: { contains: search as string, mode: 'insensitive' } },
        { defendant: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              clientType: true,
            },
          },
          assignedLawyers: {
            include: {
              lawyer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              deadlines: true,
            },
          },
        },
      }),
      prisma.case.count({ where }),
    ]);

    res.json({
      cases,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
};

export const getCaseById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const caseData = await prisma.case.findFirst({
      where: {
        id,
        firmId: req.user.firmId,
      },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedLawyers: {
          include: {
            lawyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        deadlines: {
          where: {
            status: 'PENDING',
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        },
        hearings: {
          orderBy: { hearingDate: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            documents: true,
            deadlines: true,
            hearings: true,
          },
        },
      },
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await createAuditLog('READ', 'Case', caseData.id, req.user.userId, 'Viewed case', undefined, req);

    res.json(caseData);
  } catch (error) {
    console.error('Get case by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
};

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Whitelist only fields a user is allowed to update — prevents mass assignment
    const {
      title,
      suitNumber,
      caseType,
      status,
      description,
      filingDate,
      closedDate,
      courtName,
      judgeName,
      opposingCounsel,
      clientId,
    } = req.body;

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (suitNumber !== undefined) updateData.suitNumber = suitNumber;
    if (caseType !== undefined) updateData.caseType = caseType;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (courtName !== undefined) updateData.courtName = courtName;
    if (judgeName !== undefined) updateData.judgeName = judgeName;
    if (opposingCounsel !== undefined) updateData.opposingCounsel = opposingCounsel;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (filingDate !== undefined) updateData.filingDate = new Date(filingDate);
    if (closedDate !== undefined) updateData.closedDate = new Date(closedDate);

    // Verify case exists and belongs to user's firm
    const existingCase = await prisma.case.findFirst({
      where: {
        id,
        firmId: req.user.firmId,
      },
    });

    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        assignedLawyers: {
          include: {
            lawyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog(
      'UPDATE',
      'Case',
      updatedCase.id,
      req.user.userId,
      `Updated case: ${updatedCase.title}`,
      { changes: updateData },
      req
    );

    res.json(updatedCase);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
};

export const deleteCase = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Verify case exists and belongs to user's firm
    const existingCase = await prisma.case.findFirst({
      where: {
        id,
        firmId: req.user.firmId,
      },
    });

    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await prisma.case.delete({ where: { id } });

    await createAuditLog('DELETE', 'Case', id, req.user.userId, `Deleted case: ${existingCase.title}`, undefined, req);

    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
};

export const assignLawyer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { lawyerId, role } = req.body;

    if (!lawyerId) {
      return res.status(400).json({ error: 'Lawyer ID required' });
    }

    // Verify case exists
    const caseData = await prisma.case.findFirst({
      where: {
        id,
        firmId: req.user.firmId,
      },
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if already assigned
    const existing = await prisma.caseLawyer.findUnique({
      where: {
        caseId_lawyerId: {
          caseId: id,
          lawyerId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Lawyer already assigned to this case' });
    }

    const assignment = await prisma.caseLawyer.create({
      data: {
        caseId: id,
        lawyerId,
        role,
      },
      include: {
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    await createAuditLog('UPDATE', 'Case', id, req.user.userId, `Assigned lawyer to case`, { lawyerId }, req);

    // Send email notification to the assigned lawyer
    const lawyerFullName = `${assignment.lawyer.firstName} ${assignment.lawyer.lastName}`;
    const assignedBy = `${req.user.firstName} ${req.user.lastName}`;
    
    await sendCaseAssignmentEmail(
      assignment.lawyer.email,
      lawyerFullName,
      caseData.title,
      caseData.suitNumber,
      caseData.id,
      assignedBy,
      role
    );

    // Send SMS notification if phone number is available
    if (assignment.lawyer.phone) {
      console.log(`Sending SMS to ${assignment.lawyer.phone} for case assignment`);
      await sendCaseAssignmentSMS(
        assignment.lawyer.phone,
        lawyerFullName,
        caseData.title,
        caseData.suitNumber
      );
    } else {
      console.log(`SMS not sent: Lawyer ${lawyerFullName} has no phone number in database`);
    }

    // In-app notification for assigned lawyer
    createNotification({
      userId: lawyerId,
      type: NotificationType.CASE_ASSIGNED,
      title: `You have been assigned to a case`,
      message: `${assignedBy} assigned you to case "${caseData.title}"${caseData.suitNumber ? ` (${caseData.suitNumber})` : ''}${role ? ` as ${role}` : ''}.`,
      entityType: 'Case',
      entityId: caseData.id,
      sendEmail: false, // Email already sent above
    }).catch((err) => console.error('[NOTIFY] case assign:', err));

    res.json(assignment);
  } catch (error) {
    console.error('Assign lawyer error:', error);
    res.status(500).json({ error: 'Failed to assign lawyer' });
  }
};

export const unassignLawyer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id, lawyerId } = req.params;

    await prisma.caseLawyer.delete({
      where: {
        caseId_lawyerId: {
          caseId: id,
          lawyerId,
        },
      },
    });

    await createAuditLog('UPDATE', 'Case', id, req.user.userId, `Unassigned lawyer from case`, { lawyerId }, req);

    res.json({ message: 'Lawyer unassigned successfully' });
  } catch (error) {
    console.error('Unassign lawyer error:', error);
    res.status(500).json({ error: 'Failed to unassign lawyer' });
  }
};

export const getCaseStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const where: any = {
      firmId: req.user.firmId,
    };

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SENIOR_PARTNER') {
      where.branchId = req.user.branchId;
    }

    const [total, byStatus, byType, recentCases] = await Promise.all([
      prisma.case.count({ where }),
      prisma.case.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.case.groupBy({
        by: ['caseType'],
        where,
        _count: true,
      }),
      prisma.case.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          suitNumber: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      total,
      byStatus,
      byType,
      recentCases,
    });
  } catch (error) {
    console.error('Get case stats error:', error);
    res.status(500).json({ error: 'Failed to fetch case statistics' });
  }
};
