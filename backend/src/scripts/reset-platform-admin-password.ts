import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

async function resetPlatformAdminPassword() {
  try {
    const email = 'adeayoajoba69@gmail.com';
    const newPassword = '0229349365Ade+';

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Platform admin not found with email:', email);
      return;
    }

    console.log('👤 Found user:', user.firstName, user.lastName);
    console.log('📧 Email:', user.email);
    console.log('🎭 Role:', user.role);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log('\n✅ Password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);
    console.log('\n⚠️  You can now login with the new password!');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPlatformAdminPassword();
