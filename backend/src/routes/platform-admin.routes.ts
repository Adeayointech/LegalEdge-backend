import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getPlatformStats,
  getAllFirms,
  getFirmDetails,
  getAllSupportTickets,
  updateSupportTicket,
  suspendFirm,
  unsuspendFirm,
} from '../controllers/platform-admin.controller';

const router = express.Router();

// All routes require authentication AND PLATFORM_ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.PLATFORM_ADMIN));

router.get('/stats', getPlatformStats);
router.get('/firms', getAllFirms);
router.get('/firms/:firmId', getFirmDetails);
router.patch('/firms/:firmId/suspend', suspendFirm);
router.patch('/firms/:firmId/unsuspend', unsuspendFirm);
router.get('/tickets', getAllSupportTickets);
router.put('/tickets/:ticketId', updateSupportTicket);

export default router;
