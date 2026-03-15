import { Router } from 'express';
import { body } from 'express-validator';
import * as clientController from '../controllers/client.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE, UserRole.SECRETARY),
  clientController.createClient
);

router.get('/', clientController.getClients);

router.get('/:id', clientController.getClientById);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER, UserRole.PARTNER, UserRole.ASSOCIATE, UserRole.SECRETARY),
  clientController.updateClient
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.SENIOR_PARTNER),
  clientController.deleteClient
);

export default router;
