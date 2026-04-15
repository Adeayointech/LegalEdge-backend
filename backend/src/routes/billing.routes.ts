import express from 'express';
import {
  getBillingStatus,
  initializePayment,
  verifyPayment,
  handleWebhook,
  cancelSubscription,
} from '../controllers/billing.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Paystack webhook — no auth, raw body verified via HMAC
router.post('/webhook', handleWebhook);

// All other routes require authentication
router.get('/status', authenticate, getBillingStatus);

router.post(
  '/initialize',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  initializePayment
);

router.get(
  '/verify/:reference',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  verifyPayment
);

router.post(
  '/cancel',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  cancelSubscription
);

export default router;
