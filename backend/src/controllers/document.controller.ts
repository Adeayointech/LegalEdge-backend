import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { DocumentType, DocumentStatus, NotificationType } from '@prisma/client';
import { createAuditLog } from '../middleware/auditLog';
import { createNotification } from '../services/notification.service';
import fs from 'fs';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      caseId,
      documentType,
      title,
      description,
      status,
      filedDate,
      filedBy,
    } = req.body;

    if (!caseId || !documentType || !title) {
      return res.status(400).json({ error: 'Case ID, document type, and title are required' });
    }

    // Verify case exists and user has access
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user.firmId!,
      },
    });

    if (!caseRecord) {
      // Delete uploaded file if case doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Case not found' });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        title,
        description,
        documentType,
        status: status || 'DRAFT',
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caseId,
        uploadedById: req.user.userId,
        filedDate: filedDate ? new Date(filedDate) : undefined,
        filedBy,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create initial version
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        createdById: req.user.userId,
        changeDescription: 'Initial upload',
      },
    });

    await createAuditLog(
      'CREATE',
      'Document',
      document.id,
      req.user.userId,
      `Uploaded document: ${title}`,
      undefined,
      req
    );

    // Notify assigned lawyers on the case (non-blocking)
    prisma.case.findUnique({
      where: { id: caseId },
      select: { assignedLawyers: { select: { lawyer: { select: { id: true } } } } },
    }).then((c) => {
      if (!c) return;
      const uploader = `${req.user!.firstName} ${req.user!.lastName}`;
      return Promise.all(
        c.assignedLawyers
          .filter((a) => a.lawyer.id !== req.user!.userId)
          .map((a) =>
            createNotification({
              userId: a.lawyer.id,
              type: NotificationType.DOCUMENT_UPLOADED,
              title: `New document uploaded`,
              message: `${uploader} uploaded "${title}" to case ${document.case.title}.`,
              entityType: 'Document',
              entityId: document.id,
              sendEmail: false,
            })
          )
      );
    }).catch((err) => console.error('[NOTIFY] document upload:', err));

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    // Clean up file if database operation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { caseId, documentType, status, search, page = '1', limit = '20' } = req.query;

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

    if (documentType) {
      where.documentType = documentType;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          case: {
            select: {
              id: true,
              title: true,
              suitNumber: true,
            },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: {
              version: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      documents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        case: {
          select: {
            id: true,
            title: true,
            suitNumber: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { version } = req.query;

    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
      include: {
        versions: version
          ? {
              where: { version: parseInt(version as string) },
              take: 1,
            }
          : undefined,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let filePath = document.filePath;
    let fileName = document.fileName;

    // If specific version requested
    if (version && document.versions && document.versions.length > 0) {
      filePath = document.versions[0].filePath;
      fileName = document.versions[0].fileName;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

export const updateDocumentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { status, filedDate, filedBy, proofOfFilingPath } = req.body;

    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updated = await prisma.document.update({      where: { id },
      data: {
        status,
        filedDate: filedDate ? new Date(filedDate) : undefined,
        filedBy,
        proofOfFiling: proofOfFilingPath,
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
      'Document',
      id,
      req.user.userId,
      `Updated document status to ${status}`,
      { oldStatus: document.status, newStatus: status },
      req
    );

    res.json(updated);
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({ error: 'Failed to update document status' });
  }
};

export const uploadNewVersion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id } = req.params;
    const { changeDescription } = req.body;

    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Document not found' });
    }

    const nextVersion = document.versions.length > 0 ? document.versions[0].version + 1 : 1;

    // Update document with new file
    const updated = await prisma.document.update({
      where: { id },
      data: {
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    // Create version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersion,
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        createdById: req.user.userId,
        changeDescription: changeDescription || `Version ${nextVersion}`,
      },
    });

    await createAuditLog(
      'UPDATE',
      'Document',
      id,
      req.user.userId,
      `Uploaded version ${nextVersion}`,
      { version: nextVersion, changeDescription },
      req
    );

    res.json({ document: updated, version });
  } catch (error) {
    console.error('Upload new version error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload new version' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          firmId: req.user.firmId!,
        },
      },
      include: {
        versions: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete all version files
    for (const version of document.versions) {
      if (fs.existsSync(version.filePath)) {
        fs.unlinkSync(version.filePath);
      }
    }

    // Delete current file if different
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database (cascade will delete versions)
    await prisma.document.delete({ where: { id } });

    await createAuditLog('DELETE', 'Document', id, req.user.userId, `Deleted document: ${document.title}`, undefined, req);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const getFilingStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { caseId } = req.query;

    const where: any = {
      case: {
        firmId: req.user.firmId!,
      },
    };

    if (caseId) {
      where.caseId = caseId as string;
    }

    // Get counts by document type and status
    const documents = await prisma.document.findMany({
      where,
      select: {
        documentType: true,
        status: true,
      },
    });

    const STATUS_KEY: Record<string, string> = {
      DRAFT: 'draft',
      READY_TO_FILE: 'ready',
      FILED: 'filed',
      SERVED: 'served',
      REJECTED: 'rejected',
    };

    // Group by type and status
    const stats: any = {};
    documents.forEach((doc: any) => {
      if (!stats[doc.documentType]) {
        stats[doc.documentType] = {
          total: 0,
          draft: 0,
          ready: 0,
          filed: 0,
          served: 0,
          rejected: 0,
        };
      }
      stats[doc.documentType].total++;
      const key = STATUS_KEY[doc.status] || doc.status.toLowerCase();
      stats[doc.documentType][key]++;
    });

    res.json(stats);
  } catch (error) {
    console.error('Get filing stats error:', error);
    res.status(500).json({ error: 'Failed to get filing stats' });
  }
};

export const getDocumentStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const where: any = {
      case: {
        firmId: req.user.firmId!,
      },
    };

    const [total, byStatus, byType] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.document.groupBy({
        by: ['documentType'],
        where,
        _count: true,
      }),
    ]);

    res.json({
      total,
      byStatus,
      byType,
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
};
