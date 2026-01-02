import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupInstaCharterDeals() {
  console.log("Starting cleanup of InstaCharter deals...");

  try {
    // Count existing InstaCharter deals
    const count = await prisma.emptyLeg.count({
      where: { source: "INSTACHARTER" },
    });

    console.log(`Found ${count} InstaCharter deals to remove`);

    if (count > 0) {
      // Delete all InstaCharter deals
      const result = await prisma.emptyLeg.deleteMany({
        where: { source: "INSTACHARTER" },
      });

      console.log(`Successfully removed ${result.count} InstaCharter deals`);
    }

    console.log("Cleanup completed successfully");
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupInstaCharterDeals()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default cleanupInstaCharterDeals;
