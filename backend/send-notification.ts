import 'dotenv/config';
import { PrismaClient, NotificationType } from '@prisma/client';
import { createNotification } from './src/services/notification.service';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🚀 Starting end-to-end notification send test...');

    const user = await prisma.user.findFirst({ select: { id: true, email: true, firstName: true } });
    if (!user) {
      console.error('❌ No user found to send notification to.');
      process.exit(1);
    }

    console.log(`Using user ${user.id} <${user.email}>`);

    const notification = await createNotification({
      userId: user.id,
      type: NotificationType.GENERAL,
      title: 'E2E Email Notification Test',
      message: 'This notification was created by an automated end-to-end test. It should trigger an email to the user and update the notification record.',
      entityType: 'TEST',
      entityId: 'e2e-send-1',
      sendEmail: true,
    } as any);

    console.log('✅ createNotification returned:', {
      id: notification.id,
      emailSent: notification.emailSent,
      userEmail: notification.user?.email,
    });

    console.log('⏳ Waiting 5 seconds for async email send to complete...');
    await new Promise(r => setTimeout(r, 5000));

    const refreshed = await prisma.notification.findUnique({ where: { id: notification.id } });
    console.log('🔁 Refreshed notification record:', { id: refreshed.id, emailSent: refreshed.emailSent, emailSentAt: refreshed.emailSentAt });

    console.log('🎉 End-to-end notification send test completed.');
  } catch (err: any) {
    console.error('❌ End-to-end test failed:', err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
