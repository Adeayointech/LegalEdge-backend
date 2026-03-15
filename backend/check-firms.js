const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Get all unique firm IDs
    const firms = await prisma.firm.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    console.log('=== All Firms ===');
    firms.forEach(firm => {
      console.log(`- ${firm.name} (${firm.id})`);
    });
    
    // Get users and their firms
    const users = await prisma.user.findMany({
      select: {
        email: true,
        firmId: true,
        role: true,
      },
      take: 5,
    });
    
    console.log('\n=== Users ===');
    users.forEach(user => {
      console.log(`- ${user.email} | Role: ${user.role} | Firm ID: ${user.firmId}`);
    });
    
    // Get cases by firm
    for (const firm of firms) {
      const casesCount = await prisma.case.count({
        where: { firmId: firm.id },
      });
      const deadlinesCount = await prisma.deadline.count({
        where: {
          case: { firmId: firm.id },
        },
      });
      console.log(`\n${firm.name} - Cases: ${casesCount}, Deadlines: ${deadlinesCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
