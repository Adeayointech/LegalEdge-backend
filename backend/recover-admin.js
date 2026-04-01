const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function run() {
  const email = 'adeayoajoba69@gmail.com';
  const password = '0229349365Ade+';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('ℹ️  Admin account still exists.');
    console.log(`   Role: ${existing.role}, isActive: ${existing.isActive}, isApproved: ${existing.isApproved}, emailVerified: ${existing.emailVerified}`);
    await prisma.user.update({
      where: { email },
      data: { isActive: true, isApproved: true, emailVerified: true, firmId: null },
    });
    console.log('✅ Flags corrected. Try logging in again.');
  } else {
    console.log('⚠️  Admin was cascade-deleted. Recreating...');
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'PLATFORM_ADMIN',
        isApproved: true,
        isActive: true,
        emailVerified: true,
        firmId: null,
      },
    });
    console.log('✅ Platform admin recreated successfully.');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
