// Script to generate a secure JWT secret
const crypto = require('crypto');

console.log('\n🔐 JWT Secret Generator\n');
console.log('Copy one of these secure secrets to your .env file:\n');

// Generate 3 different options
for (let i = 1; i <= 3; i++) {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log(`Option ${i}:`);
  console.log(secret);
  console.log('');
}

console.log('📝 Update your .env file:');
console.log('JWT_SECRET=<paste-one-of-the-above>\n');
