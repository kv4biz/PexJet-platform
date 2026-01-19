import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { sendToAll = false } = body;

    // Get ALL active empty legs (no limit - needed for proper subscriber matching)
    const emptyLegs = await prisma.emptyLeg.findMany({
      where: {
        status: "PUBLISHED",
        departureDateTime: { gte: new Date() },
        availableSeats: { gt: 0 },
      },
      include: {
        aircraft: { select: { name: true } },
        departureAirport: {
          select: {
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
          },
        },
        arrivalAirport: {
          select: {
            name: true,
            municipality: true,
            iataCode: true,
            icaoCode: true,
          },
        },
      },
      orderBy: { departureDateTime: "asc" },
    });

    if (emptyLegs.length === 0) {
      return NextResponse.json({
        message: "No active empty legs to notify about",
        delivery: {
          sent: 0,
          totalSubscribers: 0,
          failed: 0,
          skipped: 0,
          failedNumbers: [],
        },
        dealsIncluded: 0,
      });
    }

    // Get active subscribers
    const subscribers = await prisma.emptyLegSubscription.findMany({
      where: { isActive: true },
      select: {
        id: true,
        phone: true,
        type: true,
        cities: true,
        routeFrom: true,
        routeTo: true,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({
        message: "No active subscribers to notify",
        delivery: {
          sent: 0,
          totalSubscribers: 0,
          failed: 0,
          skipped: 0,
          failedNumbers: [],
        },
        dealsIncluded: emptyLegs.length,
      });
    }

    // Check Twilio credentials
    const hasTwilioCredentials =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER;

    if (!hasTwilioCredentials) {
      return NextResponse.json(
        { error: "WhatsApp notifications not configured" },
        { status: 503 },
      );
    }

    const twilio = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    // Format phone for WhatsApp
    const formatPhone = (phone: string) => {
      let formatted = phone.replace(/\D/g, "");
      if (formatted.startsWith("0") && formatted.length === 11) {
        formatted = "234" + formatted.substring(1);
      }
      if (formatted.length === 10 && !formatted.startsWith("234")) {
        formatted = "234" + formatted;
      }
      return formatted;
    };

    const websiteUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || "https://pexjet.com";

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const failedNumbers: string[] = [];

    // Helper to check if a leg matches subscriber codes
    const legMatchesCodes = (
      leg: (typeof emptyLegs)[0],
      codes: string[],
    ): boolean => {
      const depIata = (leg.departureAirport?.iataCode || "").toUpperCase();
      const depIcao = (
        leg.departureAirport?.icaoCode ||
        leg.departureIcao ||
        ""
      ).toUpperCase();
      const arrIata = (leg.arrivalAirport?.iataCode || "").toUpperCase();
      const arrIcao = (
        leg.arrivalAirport?.icaoCode ||
        leg.arrivalIcao ||
        ""
      ).toUpperCase();

      return codes.some(
        (code) =>
          code === depIata ||
          code === depIcao ||
          code === arrIata ||
          code === arrIcao,
      );
    };

    // Helper to generate SEO-friendly slug for empty leg URL
    const generateEmptyLegSlug = (leg: (typeof emptyLegs)[0]): string => {
      const depCity = (
        leg.departureAirport?.municipality ||
        leg.departureCity ||
        "origin"
      )
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const arrCity = (
        leg.arrivalAirport?.municipality ||
        leg.arrivalCity ||
        "destination"
      )
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const date = new Date(leg.departureDateTime);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const shortId = leg.id.slice(-8);
      return `${depCity}-to-${arrCity}-${dateStr}-${shortId}`;
    };

    // Helper to build message for specific deals
    const buildDealsMessage = (deals: typeof emptyLegs): string => {
      let message = "✨ *Latest Empty Leg Deals - PexJet*\n\n";

      for (const leg of deals.slice(0, 5)) {
        const depCode =
          leg.departureAirport?.iataCode ||
          leg.departureAirport?.icaoCode ||
          leg.departureIcao ||
          "N/A";
        const arrCode =
          leg.arrivalAirport?.iataCode ||
          leg.arrivalAirport?.icaoCode ||
          leg.arrivalIcao ||
          "N/A";
        const depCity =
          leg.departureAirport?.municipality || leg.departureCity || "";
        const arrCity =
          leg.arrivalAirport?.municipality || leg.arrivalCity || "";
        const date = new Date(leg.departureDateTime);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const price =
          leg.priceType === "FIXED" && leg.priceUsd
            ? `$${leg.priceUsd.toLocaleString()}`
            : "Contact for price";
        const dealUrl = `${websiteUrl}/empty-legs/${generateEmptyLegSlug(leg)}`;

        message += `🛫 *${depCode} → ${arrCode}*\n`;
        message += `   ${depCity} to ${arrCity}\n`;
        message += `📅 ${dateStr} | 💰 ${price}\n`;
        message += `🪑 ${leg.availableSeats} seats available\n`;
        message += `🔗 ${dealUrl}\n\n`;
      }

      message += `Reply STOP to unsubscribe.`;
      return message;
    };

    for (const subscriber of subscribers) {
      let matchingDeals: typeof emptyLegs = [];

      if (sendToAll || subscriber.type === "ALL") {
        // Send all deals to ALL type subscribers or when sendToAll is true
        matchingDeals = emptyLegs;
      } else if (
        subscriber.type === "CITY" &&
        subscriber.cities &&
        subscriber.cities.length > 0
      ) {
        // Get subscriber codes (stored as IATA/ICAO codes like "LOS", "ABV")
        const subscriberCodes = subscriber.cities.map((c: string) =>
          c.trim().toUpperCase(),
        );

        // Filter empty legs that match subscriber's city codes
        matchingDeals = emptyLegs.filter((leg) =>
          legMatchesCodes(leg, subscriberCodes),
        );
      } else if (
        subscriber.type === "ROUTE" &&
        (subscriber.routeFrom || subscriber.routeTo)
      ) {
        // Get route codes
        const subscriberCodes: string[] = [];
        if (subscriber.routeFrom)
          subscriberCodes.push(subscriber.routeFrom.trim().toUpperCase());
        if (subscriber.routeTo)
          subscriberCodes.push(subscriber.routeTo.trim().toUpperCase());

        // Filter empty legs that match subscriber's route codes
        matchingDeals = emptyLegs.filter((leg) =>
          legMatchesCodes(leg, subscriberCodes),
        );
      }

      // Skip if no matching deals
      if (matchingDeals.length === 0) {
        skippedCount++;
        continue;
      }

      // Build personalized message with only matching deals
      const personalizedMessage = buildDealsMessage(matchingDeals);
      const formattedPhone = formatPhone(subscriber.phone);

      try {
        await twilio.messages.create({
          body: personalizedMessage,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:+${formattedPhone}`,
        });
        sentCount++;
      } catch (twilioError: any) {
        console.error(
          `Failed to send to ${subscriber.phone}:`,
          twilioError.message,
        );
        failedCount++;
        failedNumbers.push(subscriber.phone);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_NOTIFICATION",
        targetType: "EmptyLeg",
        targetId: "batch",
        adminId: payload.sub,
        description: `Sent empty leg notifications: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: `Notifications sent successfully`,
      delivery: {
        sent: sentCount,
        totalSubscribers: subscribers.length,
        failed: failedCount,
        skipped: skippedCount,
        failedNumbers,
      },
      dealsIncluded: emptyLegs.length,
    });
  } catch (error: any) {
    console.error("Empty leg notify error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 },
    );
  }
}
