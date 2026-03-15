const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const casesCount = await prisma.case.count();
    const deadlinesCount = await prisma.deadline.count();
    const documentsCount = await prisma.document.count();
    
    console.log('=== Database Data ===');
    console.log('Total Cases:', casesCount);
    console.log('Total Deadlines:', deadlinesCount);
    console.log('Total Documents:', documentsCount);
    
    if (deadlinesCount > 0) {
      const upcomingDeadlines = await prisma.deadline.count({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      });
      console.log('Upcoming Deadlines (next 30 days):', upcomingDeadlines);
      
      // Show first deadline
      const firstDeadline = await prisma.deadline.findFirst({
        include: { case: true },
      });
      if (firstDeadline) {
        console.log('\nFirst Deadline:');
        console.log('- Title:', firstDeadline.title);
        console.log('- Due Date:', firstDeadline.dueDate);
        console.log('- Status:', firstDeadline.status);
        console.log('- Case Title:', firstDeadline.case.title);
        console.log('- Case Firm ID:', firstDeadline.case.firmId);
      }
    }
    
    if (casesCount > 0) {
      const firstCase = await prisma.case.findFirst();
      console.log('\nFirst Case:');
      console.log('- Title:', firstCase.title);
      console.log('- Status:', firstCase.status);
      console.log('- Firm ID:', firstCase.firmId);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
