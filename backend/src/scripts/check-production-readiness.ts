import dotenv from 'dotenv';
import { createHash } from 'crypto';

dotenv.config();

console.log('\n🔍 Production Readiness Check\n');

interface Check {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const checks: Check[] = [];

// 1. Environment
if (process.env.NODE_ENV === 'production') {
  checks.push({ name: 'Environment', status: 'pass', message: 'NODE_ENV is set to production' });
} else {
  checks.push({ name: 'Environment', status: 'warn', message: `NODE_ENV is ${process.env.NODE_ENV || 'not set'}` });
}

// 2. Database
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql://')) {
  checks.push({ name: 'Database', status: 'pass', message: 'PostgreSQL connection string configured' });
} else {
  checks.push({ name: 'Database', status: 'fail', message: 'DATABASE_URL not configured or not PostgreSQL' });
}

// 3. JWT Secret
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  checks.push({ name: 'JWT Secret', status: 'fail', message: `JWT_SECRET is too short (${jwtSecret.length} chars, need 32+)` });
} else if (jwtSecret.includes('change-this') || jwtSecret.includes('your-')) {
  checks.push({ name: 'JWT Secret', status: 'fail', message: 'JWT_SECRET contains placeholder text - must be changed!' });
} else {
  checks.push({ name: 'JWT Secret', status: 'pass', message: `JWT_SECRET is secure (${jwtSecret.length} chars)` });
}

// 4. Frontend URL
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https://')) {
  checks.push({ name: 'Frontend URL', status: 'pass', message: `HTTPS configured: ${process.env.FRONTEND_URL}` });
} else if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
  checks.push({ name: 'Frontend URL', status: 'warn', message: 'Frontend URL is localhost - update for production' });
} else {
  checks.push({ name: 'Frontend URL', status: 'fail', message: 'FRONTEND_URL not configured' });
}

// 5. CORS
if (process.env.ALLOWED_ORIGINS) {
  const origins = process.env.ALLOWED_ORIGINS.split(',');
  const hasLocalhost = origins.some(o => o.includes('localhost'));
  if (hasLocalhost && process.env.NODE_ENV === 'production') {
    checks.push({ name: 'CORS', status: 'warn', message: 'ALLOWED_ORIGINS includes localhost in production' });
  } else {
    checks.push({ name: 'CORS', status: 'pass', message: `${origins.length} origin(s) configured` });
  }
} else {
  checks.push({ name: 'CORS', status: 'warn', message: 'ALLOWED_ORIGINS not set, using FRONTEND_URL only' });
}

// 6. Email
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  checks.push({ name: 'Email', status: 'pass', message: 'SMTP credentials configured' });
} else {
  checks.push({ name: 'Email', status: 'warn', message: 'SMTP not configured - email notifications will fail' });
}

// 7. SMS
if (process.env.TERMII_API_KEY && process.env.TERMII_API_KEY.length > 20) {
  checks.push({ name: 'SMS', status: 'pass', message: 'Termii API key configured' });
} else {
  checks.push({ name: 'SMS', status: 'warn', message: 'Termii API key not configured - SMS will fail' });
}

// 8. Security Settings
const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
if (bcryptRounds >= 12) {
  checks.push({ name: 'Password Hashing', status: 'pass', message: `Strong bcrypt rounds: ${bcryptRounds}` });
} else {
  checks.push({ name: 'Password Hashing', status: 'warn', message: `Bcrypt rounds: ${bcryptRounds} (recommend 12+ for production)` });
}

// Print results
console.log('━'.repeat(60));
checks.forEach(check => {
  const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${check.name.padEnd(20)} ${check.message}`);
});
console.log('━'.repeat(60));

const failed = checks.filter(c => c.status === 'fail').length;
const warned = checks.filter(c => c.status === 'warn').length;
const passed = checks.filter(c => c.status === 'pass').length;

console.log(`\n📊 Results: ${passed} passed, ${warned} warnings, ${failed} failed\n`);

if (failed > 0) {
  console.log('❌ CRITICAL: Production deployment not ready. Fix failed checks first.\n');
  process.exit(1);
} else if (warned > 0) {
  console.log('⚠️  WARNING: Some checks failed. Review warnings before deployment.\n');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Ready for production deployment.\n');
  process.exit(0);
}
