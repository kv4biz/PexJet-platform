import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmptyLegTypes() {
  try {
    console.log("Checking Empty Leg Sources...\n");

    // Check all empty legs with their sources
    const emptyLegs = await prisma.emptyLeg.findMany({
      select: {
        id: true,
        slug: true,
        source: true,
        departureCity: true,
        arrivalCity: true,
        aircraftName: true,
        aircraftType: true,
        priceUsd: true,
        priceType: true,
        createdByAdminId: true,
        createdByOperatorId: true,
        externalId: true,
        operatorName: true,
        createdAt: true,
      },
      orderBy: [{ source: "asc" }, { createdAt: "desc" }],
    });

    console.log(`Total empty legs found: ${emptyLegs.length}\n`);

    // Group by source
    const bySource = emptyLegs.reduce(
      (acc, leg) => {
        if (!acc[leg.source]) {
          acc[leg.source] = [];
        }
        acc[leg.source].push(leg);
        return acc;
      },
      {} as Record<string, typeof emptyLegs>,
    );

    // Display each source type
    for (const [source, legs] of Object.entries(bySource)) {
      console.log(`\n=== ${source} (${legs.length} deals) ===`);

      legs.slice(0, 3).forEach((leg, index) => {
        console.log(`\n${index + 1}. ${leg.slug}`);
        console.log(`   Route: ${leg.departureCity} → ${leg.arrivalCity}`);
        console.log(
          `   Aircraft: ${leg.aircraftName || leg.aircraftType || "Unknown"}`,
        );
        console.log(
          `   Price: ${leg.priceType === "FIXED" ? `$${leg.priceUsd}` : "Contact for price"}`,
        );

        if (source === "ADMIN") {
          console.log(
            `   Created by Admin ID: ${leg.createdByAdminId || "Unknown"}`,
          );
        } else if (source === "OPERATOR") {
          console.log(
            `   Created by Operator: ${leg.operatorName || "Unknown"} (ID: ${leg.createdByOperatorId})`,
          );
        } else if (source === "INSTACHARTER") {
          console.log(`   External ID: ${leg.externalId || "Unknown"}`);
        }

        console.log(`   Created: ${leg.createdAt.toISOString().split("T")[0]}`);
      });

      if (legs.length > 3) {
        console.log(
          `   ... and ${legs.length - 3} more ${source.toLowerCase()} deals`,
        );
      }
    }

    // Check for any issues
    console.log("\n=== Data Quality Check ===");

    const issues = [];

    emptyLegs.forEach((leg) => {
      // Check for missing required fields
      if (!leg.departureCity)
        issues.push(`${leg.slug}: Missing departure city`);
      if (!leg.arrivalCity) issues.push(`${leg.slug}: Missing arrival city`);
      if (!leg.aircraftName && !leg.aircraftType)
        issues.push(`${leg.slug}: Missing aircraft info`);

      // Check source consistency
      if (leg.source === "ADMIN" && !leg.createdByAdminId) {
        issues.push(`${leg.slug}: ADMIN source but no createdByAdminId`);
      }
      if (leg.source === "OPERATOR" && !leg.createdByOperatorId) {
        issues.push(`${leg.slug}: OPERATOR source but no createdByOperatorId`);
      }
      if (leg.source === "INSTACHARTER" && !leg.externalId) {
        issues.push(`${leg.slug}: INSTACHARTER source but no externalId`);
      }
    });

    if (issues.length > 0) {
      console.log("\n⚠️  Issues found:");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    } else {
      console.log("\n✅ No data quality issues found");
    }
  } catch (error) {
    console.error("Error checking empty leg types:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmptyLegTypes();
