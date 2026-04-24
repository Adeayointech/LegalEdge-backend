import { PrismaClient } from '@prisma/client';
// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL environment variable is not set!');
  console.error('');
  console.error('📋 To fix this in Railway:');
  console.error('  1. Go to Railway Dashboard');
  console.error('  2. Click "+ New" → "Database" → "PostgreSQL"');
  console.error('  3. Wait for database to provision (2 minutes)');
  console.error('  4. DATABASE_URL will be automatically set');
  console.error('  5. Run: npx prisma migrate deploy');
  console.error('');
  process.exit(1);
}
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool configuration (via DATABASE_URL query params)
// Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Keepalive: ping DB every 4 minutes to prevent Railway closing idle connections.
// If the ping fails the connection is already dead — reconnect immediately.
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.error('DB keepalive failed, reconnecting...');
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('DB reconnected successfully');
    } catch (reconnectError) {
      console.error('DB reconnect failed:', reconnectError);
    }
  }
}, 4 * 60 * 1000); // every 4 minutes

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
