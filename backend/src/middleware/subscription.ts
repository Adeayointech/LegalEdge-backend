import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../lib/prisma';

/**
 * Blocks access when a firm's subscription has fully expired.
 * - TRIAL: allowed
 * - ACTIVE: allowed
 * - GRACE_PERIOD: allowed (with warning handled on frontend)
 * - EXPIRED / CANCELLED: blocked with 402
 *
 * PLATFORM_ADMIN users are always exempt.
 * Users without a firmId (should not happen in practice) are allowed through.
 */
export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next();

    // Platform admins are never gated
    if (req.user.role === 'PLATFORM_ADMIN') return next();

    // Users not attached to a firm pass through
    if (!req.user.firmId) return next();

    const firm = await prisma.firm.findUnique({
      where: { id: req.user.firmId },
      select: { subscriptionStatus: true, gracePeriodEndsAt: true },
    });

    if (!firm) return next();

    const { subscriptionStatus, gracePeriodEndsAt } = firm;

    if (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELLED') {
      return res.status(402).json({
        error: 'Subscription expired',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    // Extra safety: if grace period has passed, block even if DB status not yet updated
    if (
      subscriptionStatus === 'GRACE_PERIOD' &&
      gracePeriodEndsAt &&
      new Date() > gracePeriodEndsAt
    ) {
      // Update status while we're here
      await prisma.firm.update({
        where: { id: req.user.firmId },
        data: { subscriptionStatus: 'EXPIRED' },
      });
      return res.status(402).json({
        error: 'Subscription expired',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next(); // Fail open — don't block users due to our own errors
  }
};
