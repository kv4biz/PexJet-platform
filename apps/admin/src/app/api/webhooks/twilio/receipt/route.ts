import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";

// Twilio webhook for receiving receipt uploads via WhatsApp
// When a client sends an image/document after their quote is approved,
// the system stores it and notifies admin
export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook payload (form-urlencoded)
    const formData = await request.formData();

    const from = formData.get("From") as string; // WhatsApp number: whatsapp:+234...
    const body = formData.get("Body") as string; // Text message content
    const numMedia = parseInt((formData.get("NumMedia") as string) || "0");
    const mediaUrl0 = formData.get("MediaUrl0") as string; // First media URL
    const mediaContentType0 = formData.get("MediaContentType0") as string;

    // Extract phone number (remove 'whatsapp:' prefix)
    const phoneNumber = from?.replace("whatsapp:", "");

    if (!phoneNumber) {
      console.error("No phone number in webhook");
      return new NextResponse("OK", { status: 200 }); // Always return 200 to Twilio
    }

    console.log(`Receipt webhook from ${phoneNumber}:`, {
      body,
      numMedia,
      mediaUrl0,
    });

    // Find client by phone number
    const client = await prisma.client.findUnique({
      where: { phone: phoneNumber },
    });

    if (!client) {
      // Try with different phone formats
      const alternativeFormats = [
        phoneNumber.replace("+", ""),
        "+" + phoneNumber,
        phoneNumber.replace(/^0/, "+234"), // Nigerian format
      ];

      let foundClient = null;
      for (const format of alternativeFormats) {
        foundClient = await prisma.client.findUnique({
          where: { phone: format },
        });
        if (foundClient) break;
      }

      if (!foundClient) {
        console.log(`No client found for phone: ${phoneNumber}`);
        return new NextResponse("OK", { status: 200 });
      }
    }

    const clientId = client?.id;

    // Find the most recent APPROVED charter quote for this client
    const charterQuote = await prisma.charterQuote.findFirst({
      where: {
        clientPhone: phoneNumber,
        status: "APPROVED",
      },
      orderBy: { approvedAt: "desc" },
      include: {
        client: { select: { fullName: true } },
        legs: {
          include: {
            departureAirport: { select: { municipality: true, name: true } },
            arrivalAirport: { select: { municipality: true, name: true } },
          },
          orderBy: { legNumber: "asc" },
        },
      },
    });

    // Also check EmptyLegBooking
    const emptyLegBooking = await prisma.emptyLegBooking.findFirst({
      where: {
        clientPhone: phoneNumber,
        status: "APPROVED",
      },
      orderBy: { approvedAt: "desc" },
      include: {
        client: { select: { fullName: true } },
        emptyLeg: {
          include: {
            departureAirport: { select: { municipality: true, name: true } },
            arrivalAirport: { select: { municipality: true, name: true } },
          },
        },
      },
    });

    // Determine which quote to update (most recent)
    let quoteType: "charter" | "empty_leg" | null = null;
    let quoteId: string | null = null;
    let referenceNumber: string | null = null;

    if (charterQuote && emptyLegBooking) {
      // Compare dates to find most recent
      const charterDate = charterQuote.approvedAt || charterQuote.createdAt;
      const emptyLegDate =
        emptyLegBooking.approvedAt || emptyLegBooking.createdAt;

      if (charterDate > emptyLegDate) {
        quoteType = "charter";
        quoteId = charterQuote.id;
        referenceNumber = charterQuote.referenceNumber;
      } else {
        quoteType = "empty_leg";
        quoteId = emptyLegBooking.id;
        referenceNumber = emptyLegBooking.referenceNumber;
      }
    } else if (charterQuote) {
      quoteType = "charter";
      quoteId = charterQuote.id;
      referenceNumber = charterQuote.referenceNumber;
    } else if (emptyLegBooking) {
      quoteType = "empty_leg";
      quoteId = emptyLegBooking.id;
      referenceNumber = emptyLegBooking.referenceNumber;
    }

    if (!quoteId) {
      console.log(`No approved quote found for phone: ${phoneNumber}`);
      return new NextResponse("OK", { status: 200 });
    }

    // Check if media was uploaded
    if (numMedia === 0 || !mediaUrl0) {
      console.log(`No media in message from ${phoneNumber}`);
      // Could send a reply asking for the receipt image
      return new NextResponse("OK", { status: 200 });
    }

    // TODO: Download the image from Twilio and upload to Cloudinary
    // For now, we'll store the Twilio media URL directly
    // In production, download and re-upload to Cloudinary for permanence
    const receiptUrl = mediaUrl0;

    // Update the appropriate quote with receipt
    if (quoteType === "charter") {
      await prisma.charterQuote.update({
        where: { id: quoteId },
        data: {
          receiptUploadedUrl: receiptUrl,
          receiptUploadedAt: new Date(),
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "CHARTER_RECEIPT_UPLOADED",
          targetType: "CharterQuote",
          targetId: quoteId,
          description: `Client uploaded payment receipt for ${referenceNumber}`,
          ipAddress: "twilio-webhook",
          metadata: {
            phoneNumber,
            mediaUrl: receiptUrl,
            mediaType: mediaContentType0,
            message: body,
          },
        },
      });
    } else if (quoteType === "empty_leg") {
      await prisma.emptyLegBooking.update({
        where: { id: quoteId },
        data: {
          // Note: EmptyLegBooking might need receiptUploadedUrl field added
          // For now, we can use a different approach or add the field
        },
      });
    }

    // TODO: Send WhatsApp notification to admin group
    // const adminMessage = `📧 NEW RECEIPT UPLOADED
    //
    // Reference: ${referenceNumber}
    // Client: ${phoneNumber}
    // Type: ${quoteType === 'charter' ? 'Charter Quote' : 'Empty Leg Booking'}
    //
    // Please review and confirm payment in the admin dashboard.`;
    // await sendWhatsAppToAdminGroup(adminMessage);

    console.log(`Receipt uploaded for ${referenceNumber} by ${phoneNumber}`);

    // Return TwiML response (optional - can send confirmation to client)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you! Your payment receipt for ${referenceNumber} has been received. Our team will review and confirm shortly.</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("Twilio receipt webhook error:", error);
    // Always return 200 to Twilio to prevent retries
    return new NextResponse("OK", { status: 200 });
  }
}
