import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// Types for empty leg with relations
type EmptyLegWithRelations = {
  id: string;
  slug: string;
  originalPriceUsd: number;
  discountPriceUsd: number;
  availableSeats: number;
  departureDateTime: Date;
  departureAirport: {
    municipality: string | null;
    iataCode: string | null;
    name: string;
  };
  arrivalAirport: {
    municipality: string | null;
    iataCode: string | null;
    name: string;
  };
  aircraft: { name: string };
};

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
    const { emptyLegId, sendToAll } = body;

    // Get empty leg details - NO LIMIT, get all published deals
    let emptyLegs: EmptyLegWithRelations[] = [];

    if (emptyLegId) {
      const emptyLeg = await prisma.emptyLeg.findUnique({
        where: { id: emptyLegId },
        include: {
          departureAirport: true,
          arrivalAirport: true,
          aircraft: true,
        },
      });
      if (emptyLeg) {
        emptyLegs = [emptyLeg];
      }
    } else if (sendToAll) {
      // Get ALL published empty legs departing in the future (no limit)
      emptyLegs = await prisma.emptyLeg.findMany({
        where: {
          status: "PUBLISHED",
          departureDateTime: { gte: new Date() },
        },
        include: {
          departureAirport: true,
          arrivalAirport: true,
          aircraft: true,
        },
        orderBy: { departureDateTime: "asc" },
      });
    }

    if (emptyLegs.length === 0) {
      return NextResponse.json(
        { error: "No empty leg deals found to notify" },
        { status: 400 },
      );
    }

    // Get active subscribers
    const activeSubscribers = await prisma.emptyLegSubscription.findMany({
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

    if (activeSubscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers found" },
        { status: 400 },
      );
    }

    // Check Twilio credentials
    const hasTwilioCredentials =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER;

    if (!hasTwilioCredentials) {
      return NextResponse.json(
        { error: "Twilio not configured" },
        { status: 500 },
      );
    }

    const twilio = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    // Production website URL
    const websiteUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || "https://pexjet.com";

    // Format phone for WhatsApp (Nigerian format)
    const formatPhone = (phone: string) => {
      let formatted = phone.replace(/\D/g, "");
      if (formatted.startsWith("+")) {
        formatted = formatted.substring(1);
      }
      if (formatted.startsWith("0") && formatted.length === 11) {
        formatted = "234" + formatted.substring(1);
      }
      if (formatted.length === 10 && !formatted.startsWith("234")) {
        formatted = "234" + formatted;
      }
      return formatted;
    };

    // Format currency
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(price);
    };

    // Filter deals based on subscriber preferences
    const getMatchingDeals = (
      subscriber: (typeof activeSubscribers)[0],
    ): EmptyLegWithRelations[] => {
      if (subscriber.type === "ALL" || !subscriber.type) {
        // ALL type gets all deals
        return emptyLegs;
      } else if (subscriber.type === "CITY") {
        // CITY type gets deals where departure OR arrival matches their cities
        const cities = subscriber.cities.map((c) => c.toLowerCase());
        return emptyLegs.filter((leg) => {
          const depCity =
            leg.departureAirport.municipality?.toLowerCase() || "";
          const arrCity = leg.arrivalAirport.municipality?.toLowerCase() || "";
          return cities.includes(depCity) || cities.includes(arrCity);
        });
      } else if (subscriber.type === "ROUTE") {
        // ROUTE type gets deals matching specific from -> to
        return emptyLegs.filter((leg) => {
          const depCity =
            leg.departureAirport.municipality?.toLowerCase() || "";
          const depCode = leg.departureAirport.iataCode?.toLowerCase() || "";
          const arrCity = leg.arrivalAirport.municipality?.toLowerCase() || "";
          const arrCode = leg.arrivalAirport.iataCode?.toLowerCase() || "";

          const fromMatch =
            subscriber.routeFrom?.toLowerCase() === depCity ||
            subscriber.routeFrom?.toLowerCase() === depCode;
          const toMatch =
            subscriber.routeTo?.toLowerCase() === arrCity ||
            subscriber.routeTo?.toLowerCase() === arrCode;

          return fromMatch && toMatch;
        });
      }
      return [];
    };

    // Build message for a batch of deals (max 4 per message to stay under 1600 chars)
    const buildMessage = (
      deals: EmptyLegWithRelations[],
      batchNum: number,
      totalBatches: number,
    ): string => {
      let msg = "✈️ *PexJet Empty Leg Deals*";
      if (totalBatches > 1) {
        msg += ` (${batchNum}/${totalBatches})`;
      }
      msg += "\n\n";

      for (const leg of deals) {
        const discount = Math.round(
          ((leg.originalPriceUsd - leg.discountPriceUsd) /
            leg.originalPriceUsd) *
            100,
        );

        const depCity = (
          leg.departureAirport.municipality ||
          leg.departureAirport.iataCode ||
          ""
        ).substring(0, 15);
        const arrCity = (
          leg.arrivalAirport.municipality ||
          leg.arrivalAirport.iataCode ||
          ""
        ).substring(0, 15);
        const dateStr = new Date(leg.departureDateTime).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" },
        );

        msg += `🛫 *${depCity}* → *${arrCity}*\n`;
        msg += `📅 ${dateStr} | ${leg.aircraft.name}\n`;
        msg += `💰 ${formatPrice(leg.discountPriceUsd)}`;
        if (discount > 0) {
          msg += ` (${discount}% OFF)`;
        }
        msg += `\n${websiteUrl}/empty-leg/${leg.slug}\n\n`;
      }

      msg += "Reply STOP to unsubscribe.";
      return msg;
    };

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let messagesSent = 0;
    const failedNumbers: string[] = [];
    const skippedReasons: string[] = [];

    const MAX_DEALS_PER_MESSAGE = 4;

    // Process each subscriber with their personalized deals
    for (const subscriber of activeSubscribers) {
      const matchingDeals = getMatchingDeals(subscriber);

      console.log(
        `Subscriber ${subscriber.phone} (${subscriber.type}): ${matchingDeals.length} matching deals`,
      );

      if (matchingDeals.length === 0) {
        skippedCount++;
        skippedReasons.push(
          `${subscriber.phone} (${subscriber.type}): no matching deals`,
        );
        console.log(
          `⊘ Skipped ${subscriber.phone} - no matching deals for ${subscriber.type}`,
        );
        continue;
      }

      const formattedPhone = formatPhone(subscriber.phone);

      // Split deals into batches of MAX_DEALS_PER_MESSAGE
      const totalBatches = Math.ceil(
        matchingDeals.length / MAX_DEALS_PER_MESSAGE,
      );
      let subscriberSent = false;

      for (let i = 0; i < totalBatches; i++) {
        const batchDeals = matchingDeals.slice(
          i * MAX_DEALS_PER_MESSAGE,
          (i + 1) * MAX_DEALS_PER_MESSAGE,
        );
        const message = buildMessage(batchDeals, i + 1, totalBatches);

        try {
          await twilio.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+${formattedPhone}`,
          });
          messagesSent++;
          subscriberSent = true;
          console.log(
            `✓ Sent batch ${i + 1}/${totalBatches} (${batchDeals.length} deals) to +${formattedPhone}`,
          );
        } catch (twilioError: any) {
          const errorMsg = twilioError.message || "Unknown error";
          console.error(
            `✗ Failed batch ${i + 1} to ${subscriber.phone}: ${errorMsg}`,
          );
          if (!subscriberSent) {
            failedCount++;
            failedNumbers.push(`${subscriber.phone}: ${errorMsg}`);
          }
          break; // Stop sending more batches if one fails
        }
      }

      if (subscriberSent) {
        sentCount++;
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "EMPTY_LEG_UPDATE",
        targetType: "EmptyLeg",
        targetId: emptyLegId || "bulk",
        adminId: payload.sub,
        description: `Sent ${messagesSent} messages to ${sentCount} subscribers (${failedCount} failed, ${skippedCount} skipped)`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Log summary
    console.log(`\n=== NOTIFICATION SUMMARY ===`);
    console.log(`Total subscribers: ${activeSubscribers.length}`);
    console.log(`Sent to: ${sentCount}`);
    console.log(`Messages sent: ${messagesSent}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total deals available: ${emptyLegs.length}`);
    console.log(`============================\n`);

    return NextResponse.json({
      success: true,
      delivery: {
        totalSubscribers: activeSubscribers.length,
        sent: sentCount,
        messagesSent,
        failed: failedCount,
        skipped: skippedCount,
        failedNumbers: failedNumbers.length > 0 ? failedNumbers : undefined,
        skippedReasons: skippedReasons.length > 0 ? skippedReasons : undefined,
      },
      dealsIncluded: emptyLegs.length,
    });
  } catch (error: any) {
    console.error("Empty leg notification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notifications" },
      { status: 500 },
    );
  }
}
