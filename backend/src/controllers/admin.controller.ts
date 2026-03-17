import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const promoteUserToPlatformAdmin = async (req: Request, res: Response) => {
  try {
    const { email, secret } = req.body;
    
    // Security: Require special secret key for promotion
    const ADMIN_PROMOTION_SECRET = process.env.ADMIN_PROMOTION_SECRET || 'change-me-in-production';
    
    if (secret !== ADMIN_PROMOTION_SECRET) {
      return res.status(403).json({ error: 'Invalid promotion secret' });
    }
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'PLATFORM_ADMIN') {
      return res.status(400).json({ error: 'User is already a PLATFORM_ADMIN' });
    }
    
    // Promote user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'PLATFORM_ADMIN',
        isApproved: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    
    console.log(`✅ User ${email} promoted to PLATFORM_ADMIN`);
    
    res.json({
      message: 'User successfully promoted to PLATFORM_ADMIN',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Promotion error:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
};
