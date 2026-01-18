import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface TemplateData {
  // Client Information
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  passengers: string;

  // Flight Information
  departureIata: string;
  departureIcao: string;
  departureAirport: string;
  departureCity: string;
  arrivalIata: string;
  arrivalIcao: string;
  arrivalAirport: string;
  arrivalCity: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  aircraftName: string;
  aircraftCategory: string;
  aircraftImage: string;

  // Quote Information
  referenceNumber: string;
  issueDate: string;
  totalPrice: string;
  originalPrice: string;
  flightDescription: string;

  // Payment Information
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  paymentDeadline?: string;

  // Flight Confirmation Specific
  eTicketNumber?: string;
  confirmationDate?: string;
  bookingStatus?: string;
  paymentDate?: string;
  checkinTime?: string;
  terminal?: string;
  gate?: string;
  boardingTime?: string;
  crewInformation?: string;
  luggageInformation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      templateType,
      data,
    }: { templateType: "quote" | "flight-confirmation"; data: TemplateData } =
      await request.json();

    // Read template file
    const templatePath = path.join(
      process.cwd(),
      "apps",
      "admin",
      "src",
      "templates",
      templateType === "quote"
        ? "quote-invoice.html"
        : "flight-confirmation.html",
    );

    let template = fs.readFileSync(templatePath, "utf-8");

    // Replace all placeholders
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      template = template.replace(new RegExp(placeholder, "g"), value || "");
    });

    // Return the processed HTML
    return new NextResponse(template, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 },
    );
  }
}
