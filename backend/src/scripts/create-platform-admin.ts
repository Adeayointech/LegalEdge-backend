import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

async function createPlatformAdmin() {
  try {
    const email = 'adeayoajoba69@gmail.com';
    const password = '0229349365Ade';

    // Check if platform admin already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('❌ Platform admin already exists with this email');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create platform admin (no firmId - manages all firms)
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Platform',
        lastName: 'Administrator',
        role: 'PLATFORM_ADMIN',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        // No firmId or branchId - this user is above all firms
      },
    });

    console.log('✅ Platform admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: PLATFORM_ADMIN');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPlatformAdmin();
