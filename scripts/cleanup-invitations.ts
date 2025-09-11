import { db } from '@/lib/db';
import { partnerInvitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function cleanupDuplicateInvitations() {
  console.log('Starting invitation cleanup...');

  try {
    // Get all accepted invitations
    const acceptedInvitations = await db
      .select()
      .from(partnerInvitations)
      .where(eq(partnerInvitations.status, 'accepted'));

    console.log(`Found ${acceptedInvitations.length} accepted invitations`);

    // Group by user pairs and find duplicates
    const pairMap = new Map<string, Array<typeof acceptedInvitations[0]>>();

    for (const invitation of acceptedInvitations) {
      const pairKey = [invitation.fromUserId, invitation.toUserId].sort().join('-');
      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, []);
      }
      pairMap.get(pairKey)?.push(invitation);
    }

    // Find and clean up duplicates
    let duplicatesFound = 0;
    for (const [pairKey, invitations] of pairMap.entries()) {
      if (invitations.length > 1) {
        console.log(`Found ${invitations.length} duplicate invitations for pair: ${pairKey}`);

        // Keep the newest one, delete the rest
        const sorted = invitations.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const toDelete = sorted.slice(1);

        for (const invitation of toDelete) {
          await db
            .delete(partnerInvitations)
            .where(eq(partnerInvitations.id, invitation.id));

          console.log(`Deleted duplicate invitation: ${invitation.id}`);
          duplicatesFound++;
        }
      }
    }

    console.log(`Cleanup complete. Removed ${duplicatesFound} duplicate invitations.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  cleanupDuplicateInvitations()
    .then(() => {
      console.log('Cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateInvitations };
