import express from 'express';
import { sendTestHearingReminder, updateHearingReminderSettings } from '../controllers/hearing-reminder.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Send test hearing reminder
router.post('/:hearingId/test', authenticate, sendTestHearingReminder);

// Update hearing reminder settings
router.put('/:hearingId/settings', authenticate, updateHearingReminderSettings);

export default router;
