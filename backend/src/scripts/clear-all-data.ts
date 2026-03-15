import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('🗑️  Starting data cleanup...\n');

    // Delete in order to respect foreign key constraints
    console.log('Deleting audit logs...');
    const auditLogs = await prisma.auditLog.deleteMany({});
    console.log(`✅ Deleted ${auditLogs.count} audit logs`);

    console.log('Deleting case lawyers...');
    const caseLawyers = await prisma.caseLawyer.deleteMany({});
    console.log(`✅ Deleted ${caseLawyers.count} case lawyer assignments`);

    console.log('Deleting hearings...');
    const hearings = await prisma.hearing.deleteMany({});
    console.log(`✅ Deleted ${hearings.count} hearings`);

    console.log('Deleting deadlines...');
    const deadlines = await prisma.deadline.deleteMany({});
    console.log(`✅ Deleted ${deadlines.count} deadlines`);

    console.log('Deleting documents...');
    const documents = await prisma.document.deleteMany({});
    console.log(`✅ Deleted ${documents.count} documents`);

    console.log('Deleting cases...');
    const cases = await prisma.case.deleteMany({});
    console.log(`✅ Deleted ${cases.count} cases`);

    console.log('Deleting clients...');
    const clients = await prisma.client.deleteMany({});
    console.log(`✅ Deleted ${clients.count} clients`);

    console.log('Deleting users...');
    const users = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${users.count} users`);

    console.log('Deleting branches...');
    const branches = await prisma.branch.deleteMany({});
    console.log(`✅ Deleted ${branches.count} branches`);

    console.log('Deleting firms...');
    const firms = await prisma.firm.deleteMany({});
    console.log(`✅ Deleted ${firms.count} firms`);

    console.log('\n✨ All data has been cleared successfully!');
    console.log('You can now start fresh with new registrations.\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
