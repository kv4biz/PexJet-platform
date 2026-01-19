import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  sendWhatsAppMessage,
  uploadToCloudinary,
} from "@pexjet/lib";
import PDFDocument from "pdfkit";

interface FlightDocData {
  passengerName: string;
  eTicketNumber: string;
  checkInTime?: string;
  terminalInfo?: string;
  gateInfo?: string;
  luggageInfo?: string;
  boardingInfo?: string;
  pilotName?: string;
  pilotContact?: string;
  additionalInfo?: string;
}

/**
 * POST /api/quotes/empty-leg/[id]/send-flight-doc
 * Generate and send flight confirmation document to client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAccessToken(token) as unknown as {
    id: string;
    email: string;
    role: string;
  } | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { id } = params;
    const flightDocData: FlightDocData = await request.json();

    // Validate required fields
    if (!flightDocData.passengerName || !flightDocData.eTicketNumber) {
      return NextResponse.json(
        { error: "Passenger name and e-ticket number are required" },
        { status: 400 },
      );
    }

    // Fetch the booking with related data
    const booking = await prisma.emptyLegBooking.findUnique({
      where: { id },
      include: {
        emptyLeg: {
          include: {
            departureAirport: {
              select: {
                name: true,
                iataCode: true,
                icaoCode: true,
                municipality: true,
                country: { select: { name: true } },
              },
            },
            arrivalAirport: {
              select: {
                name: true,
                iataCode: true,
                icaoCode: true,
                municipality: true,
                country: { select: { name: true } },
              },
            },
            aircraft: {
              select: {
                name: true,
                manufacturer: true,
                category: true,
              },
            },
          },
        },
        client: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PAID") {
      return NextResponse.json(
        { error: "Payment must be confirmed before sending flight document" },
        { status: 400 },
      );
    }

    // Get settings for company info
    const settings = await prisma.settings.findFirst();

    // Generate PDF
    const pdfBuffer = await generateFlightConfirmationPDF({
      booking,
      flightDocData,
      settings,
    });

    // Upload PDF to Cloudinary
    const base64Pdf = pdfBuffer.toString("base64");
    const dataUri = `data:application/pdf;base64,${base64Pdf}`;

    const uploadResult = await uploadToCloudinary(dataUri, {
      folder: "flight-confirmations",
      resource_type: "raw",
      public_id: `flight-confirm-${booking.referenceNumber}-${Date.now()}`,
    });

    const flightDocumentUrl = uploadResult.secure_url;

    // Update booking with flight document info
    await prisma.emptyLegBooking.update({
      where: { id },
      data: {
        flightDocumentUrl,
        ticketNumber: flightDocData.eTicketNumber,
        checkInTime: flightDocData.checkInTime
          ? new Date(flightDocData.checkInTime)
          : null,
        terminalInfo: flightDocData.terminalInfo || null,
        gateInfo: flightDocData.gateInfo || null,
        boardingInfo: flightDocData.boardingInfo || null,
        pilotName: flightDocData.pilotName || null,
        pilotContact: flightDocData.pilotContact || null,
        additionalNotes: flightDocData.additionalInfo || null,
        confirmationSentAt: new Date(),
      },
    });

    // Send WhatsApp message with flight document
    const departureCode =
      booking.emptyLeg.departureAirport?.iataCode ||
      booking.emptyLeg.departureIcao ||
      "TBA";
    const arrivalCode =
      booking.emptyLeg.arrivalAirport?.iataCode ||
      booking.emptyLeg.arrivalIcao ||
      "TBA";

    const whatsappMessage = `✈️ *Flight Confirmation - ${booking.referenceNumber}*

Dear ${flightDocData.passengerName},

Your flight has been confirmed! Please find your e-ticket and flight details attached.

*E-Ticket:* ${flightDocData.eTicketNumber}
*Route:* ${departureCode} → ${arrivalCode}
*Date:* ${new Date(booking.emptyLeg.departureDateTime).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
*Time:* ${new Date(booking.emptyLeg.departureDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}

${flightDocData.checkInTime ? `*Check-in:* ${new Date(flightDocData.checkInTime).toLocaleString()}` : ""}
${flightDocData.terminalInfo ? `*Terminal:* ${flightDocData.terminalInfo}` : ""}
${flightDocData.gateInfo ? `*Gate:* ${flightDocData.gateInfo}` : ""}

Please arrive at the airport at least 1 hour before departure.

Safe travels! ✈️
*${settings?.companyName || "PexJet"}*`;

    await sendWhatsAppMessage({
      to: booking.clientPhone,
      message: whatsappMessage,
      mediaUrl: flightDocumentUrl,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CHARTER_CONFIRMATION_SENT",
        adminId: payload.id,
        targetType: "EmptyLegBooking",
        targetId: id,
        description: `Flight confirmation sent for ${booking.referenceNumber}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        metadata: {
          passengerName: flightDocData.passengerName,
          eTicketNumber: flightDocData.eTicketNumber,
          flightDocumentUrl,
        },
      },
    });

    return NextResponse.json({
      success: true,
      flightDocumentUrl,
      message: "Flight confirmation document sent successfully",
    });
  } catch (error) {
    console.error("Failed to send flight document:", error);
    return NextResponse.json(
      { error: "Failed to send flight document" },
      { status: 500 },
    );
  }
}

async function generateFlightConfirmationPDF({
  booking,
  flightDocData,
  settings,
}: {
  booking: any;
  flightDocData: FlightDocData;
  settings: any;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = "#D4AF37";
    const textColor = "#333333";

    // Header
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(settings?.companyName || "PexJet", { align: "center" });

    doc
      .fillColor(textColor)
      .fontSize(14)
      .font("Helvetica")
      .text("Flight Confirmation", { align: "center" });

    doc.moveDown(0.5);

    // Reference Number
    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Booking Reference: ${booking.referenceNumber}`, {
        align: "center",
      });

    doc.moveDown(1.5);

    // Passenger Information Section
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("PASSENGER INFORMATION");

    doc.moveDown(0.3);
    doc
      .strokeColor("#CCCCCC")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.5);

    doc.fillColor(textColor).fontSize(11).font("Helvetica");
    doc.text(`Passenger Name: ${flightDocData.passengerName}`);
    doc.text(`E-Ticket Number: ${flightDocData.eTicketNumber}`);
    doc.text(
      `Issue Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    );

    doc.moveDown(1);

    // Flight Information Section
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("FLIGHT INFORMATION");

    doc.moveDown(0.3);
    doc
      .strokeColor("#CCCCCC")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // Departure
    const depAirport = booking.emptyLeg.departureAirport;
    const depCode =
      depAirport?.iataCode || booking.emptyLeg.departureIcao || "TBA";
    const depCity =
      depAirport?.municipality || booking.emptyLeg.departureCity || "";
    const depCountry =
      depAirport?.country?.name || booking.emptyLeg.departureCountry || "";

    doc.fillColor(textColor).fontSize(11).font("Helvetica-Bold");
    doc.text("DEPARTURE");
    doc.font("Helvetica");
    doc.text(`Airport: ${depAirport?.name || "TBA"} (${depCode})`);
    doc.text(`City: ${depCity}${depCountry ? `, ${depCountry}` : ""}`);
    doc.text(
      `Date & Time: ${new Date(booking.emptyLeg.departureDateTime).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    );

    doc.moveDown(0.5);

    // Arrival
    const arrAirport = booking.emptyLeg.arrivalAirport;
    const arrCode =
      arrAirport?.iataCode || booking.emptyLeg.arrivalIcao || "TBA";
    const arrCity =
      arrAirport?.municipality || booking.emptyLeg.arrivalCity || "";
    const arrCountry =
      arrAirport?.country?.name || booking.emptyLeg.arrivalCountry || "";

    doc.font("Helvetica-Bold");
    doc.text("ARRIVAL");
    doc.font("Helvetica");
    doc.text(`Airport: ${arrAirport?.name || "TBA"} (${arrCode})`);
    doc.text(`City: ${arrCity}${arrCountry ? `, ${arrCountry}` : ""}`);

    doc.moveDown(0.5);

    // Aircraft
    const aircraft = booking.emptyLeg.aircraft;
    doc.font("Helvetica-Bold");
    doc.text("AIRCRAFT");
    doc.font("Helvetica");
    doc.text(
      `${aircraft?.manufacturer || ""} ${aircraft?.name || booking.emptyLeg.aircraftName || "TBA"}`,
    );
    if (aircraft?.category || booking.emptyLeg.aircraftCategory) {
      doc.text(
        `Category: ${(aircraft?.category || booking.emptyLeg.aircraftCategory).replace(/_/g, " ")}`,
      );
    }
    doc.text(`Seats: ${booking.seatsRequested}`);

    doc.moveDown(1);

    // Check-in & Boarding Section
    if (
      flightDocData.checkInTime ||
      flightDocData.terminalInfo ||
      flightDocData.gateInfo ||
      flightDocData.boardingInfo
    ) {
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("CHECK-IN & BOARDING");

      doc.moveDown(0.3);
      doc
        .strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(11).font("Helvetica");
      if (flightDocData.checkInTime) {
        doc.text(
          `Check-in Time: ${new Date(flightDocData.checkInTime).toLocaleString()}`,
        );
      }
      if (flightDocData.terminalInfo) {
        doc.text(`Terminal: ${flightDocData.terminalInfo}`);
      }
      if (flightDocData.gateInfo) {
        doc.text(`Gate: ${flightDocData.gateInfo}`);
      }
      if (flightDocData.boardingInfo) {
        doc.moveDown(0.3);
        doc.text(`Boarding Instructions: ${flightDocData.boardingInfo}`);
      }

      doc.moveDown(1);
    }

    // Luggage Information
    if (flightDocData.luggageInfo) {
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("LUGGAGE INFORMATION");

      doc.moveDown(0.3);
      doc
        .strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(11).font("Helvetica");
      doc.text(flightDocData.luggageInfo);

      doc.moveDown(1);
    }

    // Payment Information
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("PAYMENT INFORMATION");

    doc.moveDown(0.3);
    doc
      .strokeColor("#CCCCCC")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.5);

    doc.fillColor(textColor).fontSize(11).font("Helvetica");
    doc.text(
      `Total Amount: $${booking.totalPriceUsd?.toLocaleString() || "0"}`,
    );
    doc.text("Payment Status: PAID ✓");
    doc.text(`Payment Method: ${booking.paymentMethod || "Bank Transfer"}`);

    doc.moveDown(1);

    // Crew Information
    if (flightDocData.pilotName || flightDocData.pilotContact) {
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("CREW INFORMATION");

      doc.moveDown(0.3);
      doc
        .strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(11).font("Helvetica");
      if (flightDocData.pilotName) {
        doc.text(`Captain: ${flightDocData.pilotName}`);
      }
      if (flightDocData.pilotContact) {
        doc.text(`Contact: ${flightDocData.pilotContact}`);
      }

      doc.moveDown(1);
    }

    // Additional Information
    if (flightDocData.additionalInfo) {
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("ADDITIONAL INFORMATION");

      doc.moveDown(0.3);
      doc
        .strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(11).font("Helvetica");
      doc.text(flightDocData.additionalInfo);

      doc.moveDown(1);
    }

    // Footer
    doc.moveDown(2);
    doc
      .fillColor("#666666")
      .fontSize(9)
      .text(`This document was generated on ${new Date().toLocaleString()}`, {
        align: "center",
      });
    doc.text(
      `For assistance, contact ${settings?.supportEmail || "support@pexjet.com"} or ${settings?.supportPhone || ""}`,
      { align: "center" },
    );
    doc.moveDown(0.5);
    doc.text(
      `© ${new Date().getFullYear()} ${settings?.companyName || "PexJet"}. All rights reserved.`,
      {
        align: "center",
      },
    );

    doc.end();
  });
}
