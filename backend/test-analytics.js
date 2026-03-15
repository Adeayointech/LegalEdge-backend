const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAnalytics(firmId, firmName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ANALYTICS FOR: ${firmName}`);
  console.log('='.repeat(60));
  
  // Cases
  const casesByStatus = await prisma.case.groupBy({
    by: ['status'],
    where: { firmId },
    _count: true,
  });
  
  console.log('\nCases by Status:');
  casesByStatus.forEach(item => {
    console.log(`  ${item.status}: ${item._count}`);
  });
  
  // Deadlines
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  const upcomingDeadlines = await prisma.deadline.count({
    where: {
      case: { firmId },
      status: 'PENDING',
      dueDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
  });
  
  const overdueDeadlines = await prisma.deadline.count({
    where: {
      case: { firmId },
      status: 'PENDING',
      dueDate: { lt: now },
    },
  });
  
  console.log('\nDeadlines:');
  console.log(`  Upcoming (30 days): ${upcomingDeadlines}`);
  console.log(`  Overdue: ${overdueDeadlines}`);
  
  // Documents
  const documentsCount = await prisma.document.count({
    where: {
      case: { firmId },
    },
  });
  
  console.log(`\nTotal Documents: ${documentsCount}`);
}

async function main() {
  try {
    const firms = await prisma.firm.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    for (const firm of firms) {
      await testAnalytics(firm.id, firm.name);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Check which firm you are logged in as!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
