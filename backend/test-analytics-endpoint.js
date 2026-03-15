const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateAnalyticsEndpoint() {
  try {
    // Simulate the logged-in user (after logout/login with updated branchId)
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
    
    console.log('=== Simulating Analytics Endpoint ===');
    console.log('User:', user.email);
    console.log('FirmId:', user.firmId);
    console.log('BranchId:', user.branchId);
    console.log('Role:', user.role);
    
    // Simulate the analytics controller logic
    const req = {
      user: {
        userId: user.id,
        firmId: user.firmId,
        branchId: user.branchId,
        role: user.role,
      },
      query: {},
    };
    
    const baseFirmFilter = { firmId: req.user.firmId };
    console.log('\n=== Base Firm Filter ===');
    console.log(JSON.stringify(baseFirmFilter, null, 2));
    
    // Case Statistics by Status
    const casesByStatus = await prisma.case.groupBy({
      by: ['status'],
      where: baseFirmFilter,
      _count: true,
    });
    
    console.log('\n=== Cases by Status ===');
    casesByStatus.forEach(item => {
      console.log(`${item.status}: ${item._count}`);
    });
    
    // Upcoming deadlines
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingDeadlines = await prisma.deadline.count({
      where: {
        case: {
          firmId: req.user.firmId,
        },
        status: 'PENDING',
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });
    
    console.log('\n=== Upcoming Deadlines ===');
    console.log('Count:', upcomingDeadlines);
    
    // Documents
    const documentsByType = await prisma.document.groupBy({
      by: ['documentType'],
      where: {
        case: {
          firmId: req.user.firmId,
        },
      },
      _count: true,
    });
    
    console.log('\n=== Documents by Type ===');
    documentsByType.forEach(item => {
      console.log(`${item.documentType}: ${item._count}`);
    });
    
    // Total documents
    const totalDocs = documentsByType.reduce((sum, item) => sum + item._count, 0);
    console.log('Total Documents:', totalDocs);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

simulateAnalyticsEndpoint();
