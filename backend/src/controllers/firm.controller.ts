import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getFirmDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.firmId) {
      return res.status(404).json({ error: 'No firm found' });
    }

    const firm = await prisma.firm.findUnique({
      where: { id: req.user.firmId },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        website: true,
        registrationNo: true,
        createdAt: true,
      },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    res.json(firm);
  } catch (error) {
    console.error('Get firm details error:', error);
    res.status(500).json({ error: 'Failed to get firm details' });
  }
};
