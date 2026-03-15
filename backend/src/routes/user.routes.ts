import express from 'express';
import { getUsers, getUserById } from '../controllers/user.controller';
import {
  getAllUsers,
  approveUser,
  rejectUser,
  deactivateUser,
  reactivateUser,
  updateUserRole,
} from '../controllers/userManagement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// User Management (Admin only) - MUST come before /:id route
router.get(
  '/management/all',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  getAllUsers
);

router.post(
  '/:userId/approve',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  approveUser
);

router.delete(
  '/:userId/reject',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  rejectUser
);

router.patch(
  '/:userId/deactivate',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  deactivateUser
);

router.patch(
  '/:userId/reactivate',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  reactivateUser
);

router.patch(
  '/:userId/role',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  updateUserRole
);

// Get all users in the firm
router.get('/', authenticate, getUsers);

// Get user by ID (MUST come after /management/all)
router.get('/:id', authenticate, getUserById);

export default router;
