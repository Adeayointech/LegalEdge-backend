import { Router } from 'express';
import { body } from 'express-validator';
import * as caseController from '../controllers/case.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get case statistics
router.get('/stats', caseController.getCaseStats);

// CRUD operations
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  [
    body('title').trim().notEmpty(),
    body('caseType').notEmpty(),
    body('clientId').notEmpty(),
  ],
  caseController.createCase
);

router.get('/', caseController.getCases);

router.get('/:id', caseController.getCaseById);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE),
  caseController.updateCase
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  caseController.deleteCase
);

// Lawyer assignment
router.post(
  '/:id/assign-lawyer',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  [body('lawyerId').notEmpty()],
  caseController.assignLawyer
);

router.delete(
  '/:id/assign-lawyer/:lawyerId',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER),
  caseController.unassignLawyer
);

export default router;
