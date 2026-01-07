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

    // Get active empty legs
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
      take: 10,
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

    // Build deals message
    const websiteUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || "https://pexjet.com";
    let dealsMessage = "✨ *Latest Empty Leg Deals - PexJet*\n\n";

    for (const leg of emptyLegs.slice(0, 5)) {
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
      const arrCity = leg.arrivalAirport?.municipality || leg.arrivalCity || "";
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

      dealsMessage += `🛫 *${depCode} → ${arrCode}*\n`;
      dealsMessage += `   ${depCity} to ${arrCity}\n`;
      dealsMessage += `📅 ${dateStr} | 💰 ${price}\n`;
      dealsMessage += `🪑 ${leg.availableSeats} seats available\n\n`;
    }

    dealsMessage += `🔗 View all deals: ${websiteUrl}/empty-legs\n\n`;
    dealsMessage += `Reply STOP to unsubscribe.`;

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const failedNumbers: string[] = [];

    for (const subscriber of subscribers) {
      // Check if subscriber matches any deal (by city preference)
      if (
        !sendToAll &&
        subscriber.type === "CITY" &&
        subscriber.cities &&
        subscriber.cities.length > 0
      ) {
        const subscriberCities = subscriber.cities.map((c: string) =>
          c.trim().toLowerCase(),
        );
        const matchesAnyDeal = emptyLegs.some((leg) => {
          const depCity = (
            leg.departureAirport?.municipality ||
            leg.departureCity ||
            ""
          ).toLowerCase();
          const arrCity = (
            leg.arrivalAirport?.municipality ||
            leg.arrivalCity ||
            ""
          ).toLowerCase();
          return (
            subscriberCities.some((city: string) => depCity.includes(city)) ||
            subscriberCities.some((city: string) => arrCity.includes(city))
          );
        });

        if (!matchesAnyDeal) {
          skippedCount++;
          continue;
        }
      }

      const formattedPhone = formatPhone(subscriber.phone);

      try {
        await twilio.messages.create({
          body: dealsMessage,
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
