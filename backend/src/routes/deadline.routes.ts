import express from 'express';
import {
  createDeadline,
  getDeadlines,
  getDeadlineById,
  updateDeadline,
  markDeadlineComplete,
  deleteDeadline,
  getDeadlineStats,
} from '../controllers/deadline.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Get deadline statistics
router.get('/stats', authenticate, getDeadlineStats);

// Create deadline
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  createDeadline
);

// Get all deadlines (with filters)
router.get('/', authenticate, getDeadlines);

// Get deadline by ID
router.get('/:id', authenticate, getDeadlineById);

// Update deadline
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  updateDeadline
);

// Mark deadline as complete
router.patch(
  '/:id/complete',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  markDeadlineComplete
);

// Delete deadline
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  deleteDeadline
);

export default router;
