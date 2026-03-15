import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPlatformStats,
  getAllFirms,
  getFirmDetails,
  getAllSupportTickets,
  updateSupportTicket,
} from '../controllers/platform-admin.controller';

const router = express.Router();

// All routes require authentication and PLATFORM_ADMIN role
router.use(authenticate);

router.get('/stats', getPlatformStats);
router.get('/firms', getAllFirms);
router.get('/firms/:firmId', getFirmDetails);
router.get('/tickets', getAllSupportTickets);
router.put('/tickets/:ticketId', updateSupportTicket);

export default router;
