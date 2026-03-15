import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        isActive: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });
    
    console.log('\n=== All Users ===');
    users.forEach(user => {
      console.log(`${user.email} - ${user.role} - Active: ${user.isActive} - Name: ${user.firstName} ${user.lastName}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkUsers();
