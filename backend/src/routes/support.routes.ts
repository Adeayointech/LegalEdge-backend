import express from 'express';
import { createSupportTicket, getUserSupportTickets, getAllSupportTickets, updateSupportTicketStatus, getAllFirms } from '../controllers/support.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// User endpoints
router.post('/', authenticate, createSupportTicket);
router.get('/my-tickets', authenticate, getUserSupportTickets);

// Platform Admin endpoints — require PLATFORM_ADMIN role
router.get('/admin/all-tickets', authenticate, authorize(UserRole.PLATFORM_ADMIN), getAllSupportTickets);
router.put('/admin/tickets/:ticketId', authenticate, authorize(UserRole.PLATFORM_ADMIN), updateSupportTicketStatus);
router.get('/admin/firms', authenticate, authorize(UserRole.PLATFORM_ADMIN), getAllFirms);

export default router;
