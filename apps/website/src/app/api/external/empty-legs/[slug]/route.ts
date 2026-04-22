// apps/website/src/app/api/external/empty-legs/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: {
        slug: params.slug,
        status: "PUBLISHED",
      },
      include: {
        departureAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            latitude: true,
            longitude: true,
            country: { select: { name: true } },
          },
        },
        arrivalAirport: {
          select: {
            id: true,
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
            latitude: true,
            longitude: true,
            country: { select: { name: true } },
          },
        },
        aircraft: true,
      },
    });

    if (!emptyLeg) {
      return NextResponse.json({ error: "Empty leg not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: emptyLeg.id,
      slug: emptyLeg.slug,
      aircraft: emptyLeg.aircraft || null,
      departureDate: emptyLeg.departureDateTime.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch empty leg" }, { status: 500 });
  }
}
