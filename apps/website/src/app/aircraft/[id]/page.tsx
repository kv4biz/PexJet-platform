import { notFound } from "next/navigation";
import { prisma } from "@pexjet/database";
import AircraftDetail from "@/components/aircraft/AircraftDetail";
import { aircraftPageData } from "@/data";

interface Props {
  params: { id: string };
}

export default async function AircraftDetailPage({ params }: Props) {
  const { id } = params;

  const aircraft = await prisma.aircraft.findUnique({
    where: {
      id,
      availability: {
        in: ["LOCAL", "INTERNATIONAL", "BOTH"],
      },
    },
    select: {
      id: true,
      name: true,
      manufacturer: true,
      category: true,
      availability: true,
      basePricePerHour: true,
      cabinLengthFt: true,
      cabinWidthFt: true,
      cabinHeightFt: true,
      baggageCuFt: true,
      exteriorHeightFt: true,
      exteriorLengthFt: true,
      exteriorWingspanFt: true,
      image: true,
      maxPax: true,
      minPax: true,
      cruiseSpeedKnots: true,
      fuelCapacityGal: true,
      rangeNm: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!aircraft) {
    notFound();
  }

  return <AircraftDetail aircraft={aircraft} />;
}
