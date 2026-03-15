import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to add phone numbers to existing users
 * Update the phone numbers array below with your users' information
 */

const userPhoneUpdates = [
  { email: 'koredeajoba@gmail.com', phone: '08029566502' },
  // Add more users as needed:
  // { email: 'user2@example.com', phone: '08123456789' },
  // { email: 'user3@example.com', phone: '08098765432' },
];

async function updatePhoneNumbers() {
  console.log('Starting phone number update...\n');

  try {
    let successCount = 0;
    let notFoundCount = 0;

    for (const update of userPhoneUpdates) {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { email: update.email },
          select: { id: true, firstName: true, lastName: true, phone: true },
        });

        if (!user) {
          console.log(`❌ User not found: ${update.email}`);
          notFoundCount++;
          continue;
        }

        // Update phone number
        await prisma.user.update({
          where: { email: update.email },
          data: { phone: update.phone },
        });

        console.log(`✅ Updated ${user.firstName} ${user.lastName} (${update.email})`);
        console.log(`   Old phone: ${user.phone || 'none'}`);
        console.log(`   New phone: ${update.phone}\n`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Error updating ${update.email}:`, error.message);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Not found: ${notFoundCount}`);
    console.log(`📊 Total processed: ${userPhoneUpdates.length}`);

    // Show all users with their phone numbers
    console.log('\n=== All Users Phone Numbers ===');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    allUsers.forEach(user => {
      const phoneStatus = user.phone ? `📱 ${user.phone}` : '❌ No phone';
      console.log(`${user.firstName} ${user.lastName} (${user.email}) - ${phoneStatus}`);
    });

  } catch (error) {
    console.error('Error updating phone numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePhoneNumbers();
