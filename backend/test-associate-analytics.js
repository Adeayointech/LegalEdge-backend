const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAssociateAnalytics() {
  try {
    // Get the associate user
    const user = await prisma.user.findUnique({
      where: { email: 'muyiwakva@gmail.com' },
      select: {
        id: true,
        email: true,
        role: true,
        firmId: true,
        branchId: true,
      },
    });
    
    console.log('=== User Info ===');
    console.log(user);
    
    const firmId = user.firmId;
    
    // Test Case Stats endpoint logic
    const where = { firmId };
    
    // Check if the getCaseStats logic filters by branch for non-admin roles
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'SENIOR_PARTNER') {
      where.branchId = user.branchId;
    }
    
    console.log('\n=== Query Filter ===');
    console.log('Where condition:', JSON.stringify(where, null, 2));
    
    const caseCount = await prisma.case.count({ where });
    console.log('\n=== Case Count with Filter ===');
    console.log('Cases found:', caseCount);
    
    // Check cases for the firm
    const allFirmCases = await prisma.case.findMany({
      where: { firmId },
      select: {
        id: true,
        title: true,
        branchId: true,
        status: true,
      },
    });
    
    console.log('\n=== All Cases for Firm (Tope Temokun Chambers) ===');
    allFirmCases.forEach(c => {
      console.log(`- ${c.title} | Branch: ${c.branchId} | Status: ${c.status}`);
    });
    
    // Check analytics query
    const baseFirmFilter = { firmId };
    const casesByStatus = await prisma.case.groupBy({
      by: ['status'],
      where: baseFirmFilter,
      _count: true,
    });
    
    console.log('\n=== Analytics Cases by Status ===');
    casesByStatus.forEach(item => {
      console.log(`${item.status}: ${item._count}`);
    });
    
    // Check deadlines
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
    
    console.log('\n=== Upcoming Deadlines ===');
    console.log('Count:', upcomingDeadlines);
    
    // List all deadlines
    const allDeadlines = await prisma.deadline.findMany({
      where: {
        case: { firmId },
      },
      include: {
        case: {
          select: {
            title: true,
            firmId: true,
          },
        },
      },
    });
    
    console.log('\n=== All Deadlines for Firm ===');
    allDeadlines.forEach(d => {
      console.log(`- ${d.title} | Due: ${d.dueDate} | Status: ${d.status} | Case: ${d.case.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssociateAnalytics();
