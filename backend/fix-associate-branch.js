const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAssociateUser() {
  try {
    // Get the associate user
    const user = await prisma.user.findUnique({
      where: { email: 'muyiwakva@gmail.com' },
    });
    
    // Get the branch used by cases in this firm
    const caseWithBranch = await prisma.case.findFirst({
      where: { firmId: user.firmId },
      select: { branchId: true },
    });
    
    console.log('Current user branchId:', user.branchId);
    console.log('Cases are in branchId:', caseWithBranch.branchId);
    
    // Update user to have the correct branch
    const updated = await prisma.user.update({
      where: { email: 'muyiwakva@gmail.com' },
      data: {
        branchId: caseWithBranch.branchId,
      },
    });
    
    console.log('\n✅ User updated!');
    console.log('New branchId:', updated.branchId);
    
    // Test the query now
    const where = {
      firmId: user.firmId,
      branchId: caseWithBranch.branchId,
    };
    
    const caseCount = await prisma.case.count({ where });
    console.log('\nCases found with correct branch filter:', caseCount);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAssociateUser();
