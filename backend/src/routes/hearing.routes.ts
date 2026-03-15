import express from 'express';
import {
  createHearing,
  getHearings,
  getHearingById,
  updateHearing,
  deleteHearing,
} from '../controllers/hearing.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Create hearing
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  createHearing
);

// Get all hearings (with filters)
router.get('/', authenticate, getHearings);

// Get hearing by ID
router.get('/:id', authenticate, getHearingById);

// Update hearing
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  updateHearing
);

// Delete hearing
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  deleteHearing
);

export default router;
