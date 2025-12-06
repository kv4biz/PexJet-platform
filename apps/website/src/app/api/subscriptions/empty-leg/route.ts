import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, type, cities, routeFrom, routeTo } = body;

    // Validate phone number
    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return NextResponse.json(
        { error: "Valid WhatsApp phone number is required" },
        { status: 400 },
      );
    }

    // Map frontend type to database enum
    const typeMap: Record<string, string> = {
      all: "ALL",
      cities: "CITY",
      routes: "ROUTE",
    };

    // Validate subscription type
    if (!["all", "cities", "routes"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 },
      );
    }

    // Validate cities if type is "cities"
    if (
      type === "cities" &&
      (!cities || !Array.isArray(cities) || cities.length === 0)
    ) {
      return NextResponse.json(
        { error: "At least one city is required for city-based subscriptions" },
        { status: 400 },
      );
    }

    // Validate routes if type is "routes"
    if (type === "routes" && (!routeFrom || !routeTo)) {
      return NextResponse.json(
        {
          error:
            "Both departure and arrival cities are required for route-based subscriptions",
        },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const dbType = typeMap[type] as any;

    // Check if subscription already exists
    const existingSubscription = await prisma.emptyLegSubscription.findFirst({
      where: {
        phone: normalizedPhone,
        type: dbType,
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.emptyLegSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          cities: type === "cities" ? cities : [],
          routeFrom: type === "routes" ? routeFrom : null,
          routeTo: type === "routes" ? routeTo : null,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Subscription updated successfully",
        subscriptionId: existingSubscription.id,
      });
    }

    // Create new subscription
    const subscription = await prisma.emptyLegSubscription.create({
      data: {
        phone: normalizedPhone,
        type: dbType,
        cities: type === "cities" ? cities : [],
        routeFrom: type === "routes" ? routeFrom : null,
        routeTo: type === "routes" ? routeTo : null,
        isActive: true,
      },
    });

    // Notify admins via WhatsApp about new subscription
    try {
      const admins = await prisma.admin.findMany({
        select: {
          fullName: true,
          phone: true,
        },
      });

      // Build subscription details for message
      let subscriptionDetails = "";
      if (type === "all") {
        subscriptionDetails = "All Empty Leg Deals";
      } else if (type === "cities") {
        subscriptionDetails = `Cities: ${cities.join(", ")}`;
      } else if (type === "routes") {
        subscriptionDetails = `Route: ${routeFrom} → ${routeTo}`;
      }

      const message =
        `🔔 *New Empty Leg Alert Subscription*\n\n` +
        `Phone: ${normalizedPhone}\n` +
        `Type: ${type.charAt(0).toUpperCase() + type.slice(1)}\n` +
        `Details: ${subscriptionDetails}\n\n` +
        `Subscribed at: ${new Date().toLocaleString()}`;

      // Check Twilio credentials
      const hasTwilioCredentials =
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_NUMBER;

      if (hasTwilioCredentials && admins.length > 0) {
        const twilio = require("twilio")(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );

        // Helper function to format phone number
        const formatPhoneForWhatsApp = (phone: string): string => {
          let cleaned = phone.replace(/\D/g, "");
          if (cleaned.startsWith("0")) {
            cleaned = "234" + cleaned.substring(1);
          }
          if (!cleaned.startsWith("234") && cleaned.length === 10) {
            cleaned = "234" + cleaned;
          }
          return cleaned;
        };

        for (const admin of admins) {
          if (!admin.phone) continue;

          const formattedPhone = formatPhoneForWhatsApp(admin.phone);
          console.log(
            `[WhatsApp] Sending subscription notification to ${admin.fullName} (${formattedPhone})`,
          );

          try {
            await twilio.messages.create({
              body: message,
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${formattedPhone}`,
            });
            console.log(
              `[WhatsApp] ✓ Subscription notification sent to ${admin.fullName}`,
            );
          } catch (twilioError: any) {
            console.error(
              `[WhatsApp] ✗ Failed to send to ${admin.fullName}:`,
              twilioError.message || twilioError,
            );
          }
        }
      } else {
        console.log(
          "[WhatsApp] Twilio credentials not configured or no admins found, skipping notification",
        );
      }
    } catch (notificationError) {
      console.error("Failed to send admin notification:", notificationError);
      // Don't fail the subscription if notification fails
    }

    return NextResponse.json({
      message: "Subscribed successfully",
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    // Deactivate all subscriptions for this phone
    await prisma.emptyLegSubscription.updateMany({
      where: { phone: normalizedPhone },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Unsubscribed successfully",
    });
  } catch (error: any) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 },
    );
  }
}
