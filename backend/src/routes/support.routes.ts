import express from 'express';
import { createSupportTicket, getUserSupportTickets, getAllSupportTickets, updateSupportTicketStatus, getAllFirms } from '../controllers/support.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// User endpoints
router.post('/', authenticate, createSupportTicket);
router.get('/my-tickets', authenticate, getUserSupportTickets);

// Platform Admin endpoints
router.get('/admin/all-tickets', authenticate, getAllSupportTickets);
router.put('/admin/tickets/:ticketId', authenticate, updateSupportTicketStatus);
router.get('/admin/firms', authenticate, getAllFirms);

export default router;
