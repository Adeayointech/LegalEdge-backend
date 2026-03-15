import express from 'express';
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Get all branches
router.get('/', authenticate, getBranches);

// Get branch by ID
router.get('/:id', authenticate, getBranchById);

// Create branch - Only admins and partners
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  createBranch
);

// Update branch - Only admins and partners
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  updateBranch
);

// Delete branch - Only super admin and senior partner
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  deleteBranch
);

export default router;
