import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx src/scripts/promote-to-admin.ts <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { email },
      data: {
        role: 'PLATFORM_ADMIN',
        isApproved: true,
      },
    });

    console.log('✅ User promoted to PLATFORM_ADMIN successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Role: PLATFORM_ADMIN`);
    console.log('\n🚀 User can now access all platform features!');
  } catch (error) {
    console.error('❌ Error promoting user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
