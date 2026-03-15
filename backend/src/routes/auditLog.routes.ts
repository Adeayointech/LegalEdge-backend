import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
} from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Get audit log statistics
router.get('/stats', authenticate, getAuditLogStats);

// Get all audit logs (with filters) - Only admins and partners
router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  getAuditLogs
);

// Get audit log by ID - Only admins and partners
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  getAuditLogById
);

export default router;
