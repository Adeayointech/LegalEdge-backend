import { Router } from 'express';
import { sendTestReminder, updateReminderSettings } from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:deadlineId/test', authenticate, sendTestReminder);
router.put('/:deadlineId/settings', authenticate, updateReminderSettings);

export default router;
