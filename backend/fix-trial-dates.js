const { PrismaClient } = require('@prisma/client');

// Allow passing Railway DATABASE_URL as env var: DATABASE_URL=xxx node fix-trial-dates.js
const prisma = new PrismaClient();

async function main() {
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.firm.updateMany({
    where: { subscriptionStatus: 'TRIAL', trialEndsAt: null },
    data: { trialEndsAt },
  });
  console.log('Updated', result.count, 'firms with missing trialEndsAt');
  console.log('Trial ends at:', trialEndsAt.toISOString());
  await prisma.$disconnect();
}

main().catch(console.error);
