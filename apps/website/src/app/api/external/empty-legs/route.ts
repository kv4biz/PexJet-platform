// apps/website/src/app/api/external/empty-legs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function GET(request: NextRequest) {
  try {
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const limit = Number(request.nextUrl.searchParams.get("limit") || 20);
    const skip = (page - 1) * limit;

    const [emptyLegs, total] = await Promise.all([
      prisma.emptyLeg.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { departureDateTime: "desc" },
        skip,
        take: limit,
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
      }),
      prisma.emptyLeg.count({ where: { status: "PUBLISHED" } }),
    ]);

    const transformed = emptyLegs.map((leg) => ({
      id: leg.id,
      slug: leg.slug,

      departureAirport: {
        id: leg.departureAirport?.id ?? "",
        name: leg.departureAirport?.name ?? "",
        city: leg.departureAirport?.municipality ?? "",
        country: leg.departureAirport?.country?.name ?? "",
        iataCode: leg.departureAirport?.iataCode ?? "",
        icaoCode: leg.departureAirport?.icaoCode ?? "",
        latitude: leg.departureAirport?.latitude ?? 0,
        longitude: leg.departureAirport?.longitude ?? 0,
      },

      arrivalAirport: {
        id: leg.arrivalAirport?.id ?? "",
        name: leg.arrivalAirport?.name ?? "",
        city: leg.arrivalAirport?.municipality ?? "",
        country: leg.arrivalAirport?.country?.name ?? "",
        iataCode: leg.arrivalAirport?.iataCode ?? "",
        icaoCode: leg.arrivalAirport?.icaoCode ?? "",
        latitude: leg.arrivalAirport?.latitude ?? 0,
        longitude: leg.arrivalAirport?.longitude ?? 0,
      },

      aircraft: leg.aircraft || null,

      departureDate: leg.departureDateTime.toISOString(),
      availableSeats: leg.availableSeats,
      totalSeats: leg.totalSeats,

      priceUsd: leg.priceType === "FIXED" ? leg.priceUsd : null,
      priceText: leg.priceType === "FIXED" ? `$${leg.priceUsd?.toLocaleString()}` : "Contact for price",

      priceType: leg.priceType,
      status: leg.status,

      ownerType: leg.createdByOperatorId ? "operator" : "admin",

      createdAt: leg.createdAt.toISOString(),
      updatedAt: leg.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: transformed,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch empty legs" }, { status: 500 });
  }
}
