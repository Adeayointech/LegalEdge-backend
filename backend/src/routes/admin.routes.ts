import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = express.Router();

// Special endpoint to promote yourself to PLATFORM_ADMIN
// Requires authentication + secret promotion code
router.post('/promote-to-platform-admin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { promotionCode } = req.body;

    // Secret code - change this to something secure
    const PROMOTION_SECRET = process.env.PROMOTION_SECRET || 'PROMOTE_ME_2024';

    if (promotionCode !== PROMOTION_SECRET) {
      return res.status(403).json({ error: 'Invalid promotion code' });
    }

    // Update user to PLATFORM_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        role: 'PLATFORM_ADMIN',
        isApproved: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
      },
    });

    console.log(`✅ User ${updatedUser.email} promoted to PLATFORM_ADMIN`);

    res.json({
      success: true,
      message: 'Successfully promoted to PLATFORM_ADMIN',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Promotion error:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

export default router;
