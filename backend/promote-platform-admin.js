/**
 * Script to promote a user to PLATFORM_ADMIN role
 * This is for the software owner/developer, not firm owners
 * 
 * Usage: node promote-platform-admin.js <email>
 * Example: node promote-platform-admin.js adeayoajoba69@gmail.com
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function promoteToPlatformAdmin(email) {
  try {
    console.log(`\n🔍 Looking for user: ${email}...`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        firmId: true,
        isActive: true,
      },
    });

    if (!user) {
      console.error(`❌ ERROR: User with email "${email}" not found!`);
      process.exit(1);
    }

    console.log(`\n✅ User found:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Firm ID: ${user.firmId || 'NULL (no firm)'}`);
    console.log(`   Active: ${user.isActive}`);

    if (user.role === 'PLATFORM_ADMIN') {
      console.log(`\n✅ User is already a PLATFORM_ADMIN!`);
      console.log(`   No changes needed.`);
      process.exit(0);
    }

    console.log(`\n🔄 Promoting user to PLATFORM_ADMIN...`);
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'PLATFORM_ADMIN',
        isActive: true, // Ensure they're active
      },
    });

    console.log(`\n✅ SUCCESS! User has been promoted to PLATFORM_ADMIN!`);
    console.log(`   Previous Role: ${user.role}`);
    console.log(`   New Role: ${updatedUser.role}`);
    
    console.log(`\n📋 Summary:`);
    console.log(`   • This user will now receive ALL support tickets from ALL firms`);
    console.log(`   • SUPER_ADMIN users (firm owners) will NOT receive support tickets`);
    console.log(`   • This user has platform-wide access and privileges`);
    
    console.log(`\n🎉 Done! ${user.firstName} is now the PLATFORM_ADMIN.`);
    
  } catch (error) {
    console.error(`\n❌ ERROR: Failed to promote user:`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error(`\n❌ ERROR: Email address required!`);
  console.log(`\nUsage: node promote-platform-admin.js <email>`);
  console.log(`Example: node promote-platform-admin.js adeayoajoba69@gmail.com`);
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`\n❌ ERROR: Invalid email format: "${email}"`);
  process.exit(1);
}

// Run the promotion
promoteToPlatformAdmin(email);
