import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const countries = await prisma.country.count();
  const regions = await prisma.region.count();
  const airports = await prisma.airport.count();

  console.log("Countries:", countries);
  console.log("Regions:", regions);
  console.log("Airports:", airports);

  // Get last region
  const lastRegion = await prisma.region.findFirst({
    orderBy: { code: "desc" },
  });
  console.log("Last region:", lastRegion?.code, lastRegion?.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
