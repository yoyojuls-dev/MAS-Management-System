// scripts/fix-server-levels-raw.ts
// Uses raw database queries to fix ServerLevel enum values

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixServerLevelsRaw() {
  try {
    console.log('🔄 Fixing ServerLevel values using raw database queries...');

    // Use raw MongoDB query to get all members (bypasses enum validation)
    const members = await prisma.$runCommandRaw({
      find: 'Member',
      filter: {},
      projection: { _id: 1, surname: 1, givenName: 1, serverLevel: 1 }
    });

    const memberDocs = (members as any).cursor.firstBatch;
    console.log(`Found ${memberDocs.length} members to check:`);

    let updatedCount = 0;

    for (const member of memberDocs) {
      const currentLevel = member.serverLevel;
      let newLevel = currentLevel;

      console.log(`Checking ${member.surname}, ${member.givenName}: ${currentLevel}`);

      // Convert MASTER to SENIOR
      if (currentLevel === 'MASTER') {
        newLevel = 'SENIOR';
        updatedCount++;
        console.log(`📈 Will update: MASTER -> SENIOR`);
      }
      // Convert any invalid values to NEOPHYTE
      else if (!['NEOPHYTE', 'JUNIOR', 'SENIOR'].includes(currentLevel)) {
        newLevel = 'NEOPHYTE';
        updatedCount++;
        console.log(`🔄 Will update: ${currentLevel} -> NEOPHYTE`);
      }
      else {
        console.log(`✅ Already valid: ${currentLevel}`);
      }

      // Update if needed using raw MongoDB update
      if (newLevel !== currentLevel) {
        await prisma.$runCommandRaw({
          update: 'Member',
          updates: [
            {
              q: { _id: member._id },
              u: { $set: { serverLevel: newLevel } }
            }
          ]
        });
        console.log(`✅ Updated to: ${newLevel}`);
      }
    }

    console.log(`\n🎉 Fix complete! Updated ${updatedCount} records.`);
    console.log('\n📊 New ServerLevel structure:');
    console.log('   NEOPHYTE - New altar servers (beginners)');
    console.log('   JUNIOR   - Experienced servers');
    console.log('   SENIOR   - Advanced/leadership servers');

    // Verify the updates worked
    console.log('\n🔍 Verifying updates...');
    const verification = await prisma.$runCommandRaw({
      find: 'Member',
      filter: {},
      projection: { surname: 1, givenName: 1, serverLevel: 1 }
    });

    const verifyDocs = (verification as any).cursor.firstBatch;
    console.log('\nCurrent member levels:');
    verifyDocs.forEach((member: any) => {
      console.log(`  ${member.surname}, ${member.givenName}: ${member.serverLevel}`);
    });

  } catch (error) {
    console.error('❌ Error fixing ServerLevels:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixServerLevelsRaw();