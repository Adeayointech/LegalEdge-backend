/**
 * Clean Test Data Script
 * Deletes all test data (firms, users, cases, etc.) except the PLATFORM_ADMIN account.
 *
 * Usage (local DB):
 *   node clean-test-data.js
 *
 * Usage (Railway production DB):
 *   $env:DATABASE_URL="postgresql://..." ; node clean-test-data.js
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&sslmode=require' : '?sslmode=require'),
    },
  },
});

async function cleanTestData() {
  console.log('\n🧹 LegalEdge — Clean Test Data');
  console.log('=====================================');
  console.log('⚠️  This will permanently delete ALL data except the PLATFORM_ADMIN account.');
  console.log(`📡  DB: ${(process.env.DATABASE_URL || '').replace(/:([^:@]+)@/, ':***@')}\n`);

  // Safety: confirm the platform admin exists before doing anything
  const admin = await prisma.user.findFirst({
    where: { role: 'PLATFORM_ADMIN' },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!admin) {
    console.error('❌ No PLATFORM_ADMIN found in this database. Aborting.');
    process.exit(1);
  }

  console.log(`✅ Platform admin found: ${admin.firstName} ${admin.lastName} (${admin.email})`);
  console.log('   This account will be preserved.\n');

  // Count current data (sequential to respect Railway connection limits)
  const firms   = await prisma.firm.count();
  const users   = await prisma.user.count({ where: { role: { not: 'PLATFORM_ADMIN' } } });
  const cases   = await prisma.case.count();
  const clients = await prisma.client.count();

  console.log('📊 Current data:');
  console.log(`   Firms:       ${firms}`);
  console.log(`   Users:       ${users} (excl. platform admin)`);
  console.log(`   Cases:       ${cases}`);
  console.log(`   Clients:     ${clients}`);
  console.log('');

  if (firms === 0 && users === 0) {
    console.log('✅ Database is already clean. Nothing to delete.');
    return;
  }

  console.log('🗑️  Starting deletion (safe order)...\n');

  // Step 1 — Notifications (only for non-admin users; admin notifs are harmlessly kept)
  const n1 = await prisma.notification.deleteMany({
    where: { user: { role: { not: 'PLATFORM_ADMIN' } } },
  });
  console.log(`  [1/12] Notifications      deleted: ${n1.count}`);

  // Step 2 — Support tickets submitted by non-admin users
  const n2 = await prisma.supportTicket.deleteMany({
    where: { user: { role: { not: 'PLATFORM_ADMIN' } } },
  });
  console.log(`  [2/12] Support tickets    deleted: ${n2.count}`);

  // Step 3 — Audit logs (userId is SetNull so no FK issue; also cascade from case/document)
  const n3 = await prisma.auditLog.deleteMany({});
  console.log(`  [3/12] Audit logs         deleted: ${n3.count}`);

  // Step 4 — Document versions
  const n4 = await prisma.documentVersion.deleteMany({});
  console.log(`  [4/12] Document versions  deleted: ${n4.count}`);

  // Step 5 — Documents
  const n5 = await prisma.document.deleteMany({});
  console.log(`  [5/12] Documents          deleted: ${n5.count}`);

  // Step 6 — Case-lawyer assignments
  const n6 = await prisma.caseLawyer.deleteMany({});
  console.log(`  [6/12] Case assignments   deleted: ${n6.count}`);

  // Step 7 — Hearings
  const n7 = await prisma.hearing.deleteMany({});
  console.log(`  [7/12] Hearings           deleted: ${n7.count}`);

  // Step 8 — Deadlines
  const n8 = await prisma.deadline.deleteMany({});
  console.log(`  [8/12] Deadlines          deleted: ${n8.count}`);

  // Step 9 — Cases (must come before Clients due to Restrict FK on clientId)
  const n9 = await prisma.case.deleteMany({});
  console.log(`  [9/12] Cases              deleted: ${n9.count}`);

  // Step 10 — Clients
  const n10 = await prisma.client.deleteMany({});
  console.log(`  [10/12] Clients           deleted: ${n10.count}`);

  // Step 11 — All non-PLATFORM_ADMIN users
  const n11 = await prisma.user.deleteMany({
    where: { role: { not: 'PLATFORM_ADMIN' } },
  });
  console.log(`  [11/12] Users             deleted: ${n11.count}`);

  // Step 12 — Detach platform admin from any firm, then delete branches and firms
  await prisma.user.updateMany({
    where: { role: 'PLATFORM_ADMIN' },
    data: { firmId: null, branchId: null },
  });
  const n12a = await prisma.branch.deleteMany({});
  const n12b = await prisma.firm.deleteMany({});
  console.log(`  [12/12] Branches/Firms    deleted: ${n12a.count} branches, ${n12b.count} firms`);

  console.log('\n=====================================');
  console.log('✅ Done! Database is clean.');
  console.log(`👤 Platform admin preserved: ${admin.email}`);
  console.log('🚀 You can now test afresh.\n');
}

cleanTestData()
  .catch((err) => {
    console.error('\n❌ Error during cleanup:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
