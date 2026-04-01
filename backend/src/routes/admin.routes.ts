import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = express.Router();

// One-time bootstrap: promote a user to PLATFORM_ADMIN.
// This endpoint is disabled once any PLATFORM_ADMIN exists in the database.
// Requires: valid JWT + BOOTSTRAP_ADMIN_SECRET env var (no default).
router.post('/bootstrap-platform-admin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fail fast if the secret is not configured in environment
    const secret = process.env.BOOTSTRAP_ADMIN_SECRET;
    if (!secret || secret.length < 20) {
      return res.status(503).json({ error: 'Bootstrap not available' });
    }

    const { bootstrapSecret } = req.body;
    if (!bootstrapSecret || bootstrapSecret !== secret) {
      console.warn(`[BOOTSTRAP] Failed attempt by userId=${req.user.userId}`);
      return res.status(403).json({ error: 'Invalid bootstrap secret' });
    }

    // Disable this endpoint once a PLATFORM_ADMIN already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'PLATFORM_ADMIN' },
    });
    if (existingAdmin) {
      return res.status(403).json({ error: 'Bootstrap not available' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { role: 'PLATFORM_ADMIN', isApproved: true },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    console.log(`[BOOTSTRAP] ${updatedUser.email} promoted to PLATFORM_ADMIN`);

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Bootstrap failed' });
  }
});

export default router;
