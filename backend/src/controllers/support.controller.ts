import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendEmail } from '../utils/email';
import { createNotification } from '../services/notification.service';
import { NotificationType } from '@prisma/client';

export const createSupportTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subject, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        message,
        priority: priority || 'MEDIUM',
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            firmId: true,
          },
        },
      },
    });

    // Send email notification to support team (non-blocking)
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    if (supportEmail) {
      const priorityEmoji = priority === 'URGENT' ? '🚨' : priority === 'HIGH' ? '⚠️' : '📧';
      // Fire and forget - don't block on email sending
      sendEmail({
        to: supportEmail,
        subject: `${priorityEmoji} New Support Ticket: ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .ticket-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #3B82F6; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${priorityEmoji} New Support Ticket</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Priority: ${priority || 'MEDIUM'}</p>
              </div>
              <div class="content">
                <div class="ticket-box">
                  <h2 style="margin-top: 0; color: #3B82F6;">Ticket Details</h2>
                  
                  <div class="info-row">
                    <span class="label">From:</span> ${ticket.user.firstName} ${ticket.user.lastName} (${ticket.user.email})
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Role:</span> ${ticket.user.role}
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Subject:</span> ${subject}
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Message:</span>
                    <p style="margin-top: 5px; white-space: pre-wrap;">${message}</p>
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Ticket ID:</span> ${ticket.id}
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Submitted:</span> ${new Date(ticket.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                  Please respond to this ticket as soon as possible.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }).catch(err => console.error('Failed to send support email:', err));
    }

    // Send confirmation email to user (non-blocking)
    sendEmail({
      to: ticket.user.email,
      subject: `Support Ticket Received: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Support Ticket Received</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.user.firstName},</p>
              <p>We have received your support ticket and our team will respond to you as soon as possible.</p>
              
              <p><strong>Ticket ID:</strong> ${ticket.id}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Priority:</strong> ${priority || 'MEDIUM'}</p>
              
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                Thank you for contacting us!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error('Failed to send confirmation email:', err));

    // Create notification ONLY for PLATFORM_ADMIN (developer/software owner)
    // Do NOT notify firm SUPER_ADMIN as they are firm owners, not platform owners
    const ticketCreatorFirmId = ticket.user.firmId;
    console.log(`[NOTIFICATION] Creating notifications for ticket from firm: ${ticketCreatorFirmId || 'NO FIRM'}`);
    console.log(`[NOTIFICATION] Looking for PLATFORM_ADMIN users only...`);
    
    const platformAdmins = await prisma.user.findMany({
      where: { 
        role: 'PLATFORM_ADMIN', 
        isActive: true,
      },
      select: { id: true, email: true, firmId: true, role: true },
    });

    console.log(`[NOTIFICATION] Found ${platformAdmins.length} PLATFORM_ADMIN(s) to notify:`);
    platformAdmins.forEach(admin => {
      console.log(`  - ${admin.email} (role: ${admin.role}, firmId: ${admin.firmId || 'NULL'})`);
    });
    
    if (platformAdmins.length === 0) {
      console.log(`[NOTIFICATION] ⚠️ WARNING: No PLATFORM_ADMIN found! Support tickets will not be notified to anyone!`);
      console.log(`[NOTIFICATION] Please promote a user to PLATFORM_ADMIN role.`);
    }
    
    for (const admin of platformAdmins) {
      console.log(`[NOTIFICATION] Creating notification for PLATFORM_ADMIN: ${admin.email}`);
      await createNotification({
        userId: admin.id,
        type: NotificationType.SUPPORT_TICKET,
        title: `New ${priority || 'MEDIUM'} Priority Support Ticket`,
        message: `${ticket.user.firstName} ${ticket.user.lastName} submitted: "${subject}"`,
        entityType: 'SupportTicket',
        entityId: ticket.id,
        sendEmail: false, // Email already sent above
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};

export const getUserSupportTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
};

// Platform Admin endpoints - Only accessible by Platform Admin
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

export const updateSupportTicketStatus = async (req: AuthRequest, res: Response) => {
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
            id: true,
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

    // Send email notification if there's a response (non-blocking)
    if (response && response !== ticket.response) {
      sendEmail({
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
      }).catch(err => console.error('Failed to send ticket response email:', err));

      // Create notification for the user
      await createNotification({
        userId: ticket.user.id,
        type: NotificationType.SUPPORT_TICKET,
        title: `Support Team Responded to Your Ticket`,
        message: `Your support ticket "${ticket.subject}" has been updated with a response from our team.`,
        entityType: 'SupportTicket',
        entityId: ticket.id,
        sendEmail: false, // Email already sent above
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
};

// User reply to admin response
export const addUserReply = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return res.status(400).json({ error: 'Cannot reply to a resolved or closed ticket' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        userReply: message.trim(),
        userRepliedAt: new Date(),
      },
    });

    // Notify platform admins of the user reply
    const platformAdmins = await prisma.user.findMany({
      where: { role: 'PLATFORM_ADMIN', isActive: true },
      select: { id: true },
    });

    for (const admin of platformAdmins) {
      await createNotification({
        userId: admin.id,
        type: NotificationType.SUPPORT_TICKET,
        title: 'User Replied to Support Ticket',
        message: `${ticket.user.firstName} ${ticket.user.lastName} replied to: "${ticket.subject}"`,
        entityType: 'SupportTicket',
        entityId: ticket.id,
        sendEmail: false,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Add user reply error:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
};

// Get all firms for platform admin
export const getAllFirms = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Platform Admin only.' });
    }

    const firms = await prisma.firm.findMany({
      include: {
        users: {
          select: {
            id: true,
            role: true,
          },
        },
        cases: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
            cases: true,
            branches: true,
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

