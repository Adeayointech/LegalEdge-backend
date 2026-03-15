import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendEmail } from '../utils/email';

export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Platform Admin only.' });
    }

    const [totalFirms, totalUsers, totalTickets, openTickets] = await Promise.all([
      prisma.firm.count(),
      prisma.user.count(),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    res.json({
      totalFirms,
      totalUsers,
      totalTickets,
      openTickets,
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Failed to get platform stats' });
  }
};

export const getAllFirms = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Platform Admin only.' });
    }

    const firms = await prisma.firm.findMany({
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
            branches: true,
          },
        },
        users: {
          where: {
            role: 'SUPER_ADMIN',
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ firms });
  } catch (error) {
    console.error('Get all firms error:', error);
    res.status(500).json({ error: 'Failed to get firms' });
  }
};

export const getFirmDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Platform Admin only.' });
    }

    const { firmId } = req.params;

    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isApproved: true,
            createdAt: true,
            lastLoginAt: true,
            branch: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            state: true,
            _count: {
              select: {
                users: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            cases: true,
            clients: true,
            branches: true,
          },
        },
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

export const getAllSupportTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Platform Admin only.' });
    }

    const { status, priority, firmId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (firmId) {
      where.user = {
        firmId: firmId as string,
      };
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            firm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { priority: 'desc' }, // URGENT first
        { createdAt: 'desc' },
      ],
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Get all support tickets error:', error);
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
};

export const updateSupportTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Platform Admin only.' });
    }

    const { ticketId } = req.params;
    const { status, response } = req.body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: status || ticket.status,
        response: response !== undefined ? response : ticket.response,
        respondedAt: response !== undefined ? new Date() : ticket.respondedAt,
        respondedBy: response !== undefined ? req.user.userId : ticket.respondedBy,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send email notification if there's a response
    if (response && response !== ticket.response) {
      await sendEmail({
        to: updated.user.email,
        subject: `Update on Your Support Ticket: ${ticket.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .response-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #10B981; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">✅ Support Team Response</h1>
              </div>
              <div class="content">
                <p>Hello ${updated.user.firstName},</p>
                <p>We have an update on your support ticket:</p>
                
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Status:</strong> ${updated.status.replace('_', ' ')}</p>
                
                <div class="response-box">
                  <p style="font-weight: bold; margin-top: 0;">Support Team Response:</p>
                  <p style="white-space: pre-wrap;">${response}</p>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                  You can view this response in your profile under "My Support Tickets".
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
};
