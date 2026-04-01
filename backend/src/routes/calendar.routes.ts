import express from 'express';
import { authenticate } from '../middleware/auth';
import { getCalendarEvents } from '../controllers/calendar.controller';

const router = express.Router();

router.get('/events', authenticate, getCalendarEvents);

export default router;
