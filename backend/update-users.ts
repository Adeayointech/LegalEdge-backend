import prisma from './src/lib/prisma';

async function updateExistingUsers() {
  try {
    console.log('Updating existing users to approved status...');
    
    // Set all existing users to approved (since they already exist)
    const result = await prisma.user.updateMany({
      where: {},
      data: {
        isApproved: true,
      },
    });
    
    console.log(`✅ Updated ${result.count} users to approved status`);
    
    // Display all users with their status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });
    
    console.log('\n📋 Current users:');
    users.forEach(user => {
      console.log(`  ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Active: ${user.isActive}, Approved: ${user.isApproved}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsers();
