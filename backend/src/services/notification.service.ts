import prisma from '../lib/prisma';
import { NotificationType } from '@prisma/client';
import { sendEmail } from '../utils/email';
import { io } from '../index';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  sendEmail?: boolean;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, type, title, message, entityType, entityId, sendEmail: shouldSendEmail = true } = params;

  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
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

  // Push to connected client instantly via WebSocket
  io.to(`user:${userId}`).emit('notification', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entityType: notification.entityType,
    entityId: notification.entityId,
    isRead: false,
    createdAt: notification.createdAt,
  });

  // Send email notification if requested (non-blocking)
  if (shouldSendEmail && notification.user.email) {
    // Fire and forget - don't await
    sendNotificationEmail(notification)
      .then(async () => {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      })
      .catch(error => {
        console.error('Failed to send notification email:', error);
      });
  }

  return notification;
};

export const sendNotificationEmail = async (notification: any) => {
  const subject = `🔔 ${notification.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .notification-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #f59e0b, #eab308); color: #0f172a; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔔 New Notification</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Lawravel</p>
        </div>
        
        <div class="content">
          <p>Hello ${notification.user.firstName},</p>
          
          <div class="notification-box">
            <h2 style="margin-top: 0; color: #f59e0b;">${notification.title}</h2>
            <p style="margin: 0;">${notification.message}</p>
          </div>
          
          <p>Please log in to your account to view full details and take any necessary actions.</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">
            View in Platform →
          </a>
          
          <div class="footer">
            <p>This is an automated notification from Lawravel</p>
            <p>© ${new Date().getFullYear()} Lawravel. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: notification.user.email,
    subject,
    html,
  });
};

export const createBulkNotifications = async (params: CreateNotificationParams[]) => {
  const notifications = await prisma.notification.createMany({
    data: params.map(p => ({
      userId: p.userId,
      type: p.type,
      title: p.title,
      message: p.message,
      entityType: p.entityType,
      entityId: p.entityId,
    })),
  });

  return notifications;
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return await prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

export const markAllAsRead = async (userId: string) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

export const getUnreadCount = async (userId: string) => {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

export const getUserNotifications = async (userId: string, limit = 50) => {
  console.log(`[NOTIFICATION] Fetching notifications for user: ${userId}`);
  
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          firmId: true,
        },
      },
    },
  });
  
  console.log(`[NOTIFICATION] Found ${notifications.length} notifications for user ${userId}`);
  if (notifications.length > 0) {
    console.log(`[NOTIFICATION] Sample notification:`, {
      id: notifications[0].id,
      type: notifications[0].type,
      title: notifications[0].title,
      userId: notifications[0].userId,
      userEmail: notifications[0].user.email,
    });
  }
  
  return notifications;
};

export const deleteNotification = async (notificationId: string, userId: string) => {
  return await prisma.notification.delete({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
  });
};
