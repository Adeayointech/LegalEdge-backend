import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

// Password reset (public — no auth needed)
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  authController.resetPassword
);

// Email verification (public)
router.get('/verify-email', authController.verifyEmail);
router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  authController.resendVerification
);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

router.post('/setup-2fa', authenticate, authController.setupTwoFactor);

router.post(
  '/enable-2fa',
  authenticate,
  [body('token').isLength({ min: 6, max: 6 })],
  authController.enableTwoFactor
);

router.post(
  '/disable-2fa',
  authenticate,
  [body('token').isLength({ min: 6, max: 6 })],
  authController.disableTwoFactor
);

export default router;
