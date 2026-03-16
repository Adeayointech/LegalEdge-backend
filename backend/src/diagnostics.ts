import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful - Users: ${userCount}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    await prisma.$disconnect();
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT'
  ];
  
  const optional = [
    'FRONTEND_URL',
    'ALLOWED_ORIGINS',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  console.log('\n📋 Required Variables:');
  required.forEach(key => {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? '✓' : '✗ MISSING'}`);
  });
  
  console.log('\n📋 Optional Variables:');
  optional.forEach(key => {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? '✓' : '✗'}`);
  });
  
  const allRequiredPresent = required.every(key => process.env[key]);
  return allRequiredPresent;
}

async function runDiagnostics() {
  console.log('🏥 Starting Server Diagnostics\n');
  console.log('='.repeat(50));
  
  const envCheck = await checkEnvironmentVariables();
  console.log('='.repeat(50));
  
  if (!envCheck) {
    console.error('\n❌ Missing required environment variables!');
    console.log('\n📝 Make sure to set these in Railway:');
    console.log('   - DATABASE_URL (auto-filled by Railway PostgreSQL)');
    console.log('   - JWT_SECRET');
    console.log('   - NODE_ENV=production');
    console.log('   - PORT (Railway sets this automatically)');
    console.log('   - FRONTEND_URL');
    process.exit(1);
  }
  
  const dbCheck = await checkDatabase();
  console.log('='.repeat(50));
  
  if (!dbCheck) {
    console.error('\n❌ Database connection failed!');
    console.log('\n📝 To fix:');
    console.log('   1. Make sure Railway PostgreSQL is added to your service');
    console.log('   2. Run: npx prisma migrate deploy');
    console.log('   3. Check DATABASE_URL is set correctly');
    process.exit(1);
  }
  
  console.log('\n✅ All diagnostics passed!');
  console.log('🚀 Server should start successfully\n');
}

runDiagnostics();
