import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createProductionAdmin() {
  try {
    console.log('🔧 Creating production platform admin account...\n');

    // Admin details (same as your local setup)
    const adminEmail = 'adeayoajoba69@gmail.com';
    const adminPassword = '0229349365Ade+';
    const adminFirstName = 'Admin';
    const adminLastName = 'User';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Admin account already exists!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log('🔐 Password: (unchanged)');
      console.log('\nYou can login with your existing credentials.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'PLATFORM_ADMIN',
        isApproved: true,
      },
    });

    console.log('✅ Platform admin created successfully!\n');
    console.log('📋 Admin Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: PLATFORM_ADMIN`);
    console.log('\n🚀 You can now login to your production app!');
    console.log(`   Frontend: https://legal-edge-backend-frontend.vercel.app`);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();
