import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

// POST - Confirm payment for charter quote (admin action after reviewing receipt)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;

    // Find existing quote
    const existingQuote = await prisma.charterQuote.findUnique({
      where: { id },
      include: {
        client: { select: { phone: true, fullName: true, email: true } },
        legs: {
          include: {
            departureAirport: {
              select: { name: true, municipality: true, iataCode: true },
            },
            arrivalAirport: {
              select: { name: true, municipality: true, iataCode: true },
            },
            aircraft: { select: { name: true, manufacturer: true } },
          },
          orderBy: { legNumber: "asc" },
        },
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Charter quote not found" },
        { status: 404 },
      );
    }

    // Only allow confirming payment for APPROVED quotes that have receipt uploaded
    if (existingQuote.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Can only confirm payment for approved quotes" },
        { status: 400 },
      );
    }

    // Check if receipt was uploaded
    if (!existingQuote.receiptUploadedUrl) {
      return NextResponse.json(
        { error: "No receipt has been uploaded by the client yet" },
        { status: 400 },
      );
    }

    // Update quote to PAID
    const updatedQuote = await prisma.$transaction(async (tx) => {
      const quote = await tx.charterQuote.update({
        where: { id },
        data: {
          status: "PAID",
          paymentConfirmedAt: new Date(),
          paymentConfirmedById: payload.sub,
        },
        include: {
          client: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
          legs: {
            include: {
              departureAirport: {
                select: { name: true, municipality: true, iataCode: true },
              },
              arrivalAirport: {
                select: { name: true, municipality: true, iataCode: true },
              },
              aircraft: { select: { name: true, manufacturer: true } },
            },
            orderBy: { legNumber: "asc" },
          },
          paymentConfirmedBy: { select: { id: true, fullName: true } },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "CHARTER_PAYMENT_CONFIRMED",
          targetType: "CharterQuote",
          targetId: id,
          adminId: payload.sub,
          description: `Confirmed payment for charter quote ${existingQuote.referenceNumber}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          metadata: {
            totalPriceUsd: existingQuote.totalPriceUsd,
            receiptUrl: existingQuote.receiptUploadedUrl,
          },
        },
      });

      return quote;
    });

    // TODO: Generate Receipt PDF
    // const receiptDocUrl = await generateReceiptDocument(updatedQuote);
    // await prisma.charterQuote.update({ where: { id }, data: { receiptUrl: receiptDocUrl } });

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message:
        "Payment confirmed successfully. You can now send the flight confirmation.",
    });
  } catch (error: any) {
    console.error("Failed to confirm payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm payment" },
      { status: 500 },
    );
  }
}
