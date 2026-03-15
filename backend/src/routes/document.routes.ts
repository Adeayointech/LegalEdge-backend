import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  updateDocumentStatus,
  uploadNewVersion,
  deleteDocument,
  getFilingStats,
  getDocumentStats,
} from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Document routes working!' });
});

// Upload document
router.post(
  '/upload',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE, UserRole.SECRETARY),
  uploadSingle,
  uploadDocument
);

// Get all documents (with filters)
router.get('/', authenticate, getDocuments);

// Get document statistics
router.get('/stats', authenticate, getDocumentStats);

// Get filing statistics
router.get('/stats/filing', authenticate, getFilingStats);

// Get document by ID
router.get('/:id', authenticate, getDocumentById);

// Download document
router.get('/:id/download', authenticate, downloadDocument);

// Update document status
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  updateDocumentStatus
);

// Upload new version
router.post(
  '/:id/version',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE, UserRole.SECRETARY),
  uploadSingle,
  uploadNewVersion
);

// Delete document
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  deleteDocument
);

export default router;
