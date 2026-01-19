import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing airports...");
  await prisma.airport.deleteMany();
  console.log("Clearing regions...");
  await prisma.region.deleteMany();
  console.log("✅ Cleared airports and regions");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
