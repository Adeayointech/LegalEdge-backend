require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔍 Notification smoke test starting...');

    // Pick an existing user (first user)
    const user = await prisma.user.findFirst({ select: { id: true, email: true, firstName: true } });
    if (!user) {
      console.error('❌ No user found in database to attach a notification to.');
      process.exit(1);
    }

    console.log(`Using user: ${user.id} (${user.email})`);

    // Create a notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'GENERAL',
        title: 'Test Notification',
        message: 'This is a notification created by the smoke test. It should appear in the user notifications list.',
        entityType: 'TEST',
        entityId: 'smoke-test-1',
      },
    });

    console.log('✅ Notification created:', { id: notification.id, title: notification.title });

    // Fetch recent notifications for the user
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(`🔎 Retrieved ${notifications.length} notifications for user ${user.id}`);

    if (notifications.length > 0) {
      console.log('Sample:', notifications[0]);
    }

    console.log('🎉 Notification smoke test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Smoke test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();