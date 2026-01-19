import type PDFKit from "pdfkit";
import path from "path";
import { COLORS } from "./constants";

// Font path for bundled TTF font
const FONT_PATH = path.join(__dirname, "..", "fonts", "NotoSans-Regular.ttf");

interface QuoteConfirmationData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  flightType: string;
  legs: Array<{
    legNumber: number;
    departure: string;
    arrival: string;
    departureDateTime: string;
    estimatedArrival: string;
    duration: string;
    aircraft: string;
    price: string;
  }>;
  totalPrice: string;
  paymentDeadline: string;
  paymentLink: string;
  createdAt: string;
}

interface FlightConfirmationData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  flightType: string;
  legs: Array<{
    legNumber: number;
    departure: string;
    departureCode: string;
    arrival: string;
    arrivalCode: string;
    departureDateTime: string;
    estimatedArrival: string;
    duration: string;
    aircraft: string;
    passengerCount: number;
  }>;
  paymentReference: string;
  paidAt: string;
}

interface ReceiptData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  paymentType: string;
  description: string;
  amount: string;
  paymentMethod: string;
  transactionReference: string;
  paidAt: string;
}

/**
 * Generate a PDF buffer from a PDFDocument
 */
function generatePDFBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

async function createPDFDocument(
  options: PDFKit.PDFDocumentOptions,
): Promise<PDFKit.PDFDocument> {
  const PDFDocument = require("pdfkit");
  const fs = require("fs");

  // Check if font file exists, otherwise use built-in (for dev environments)
  let fontPath = FONT_PATH;

  // Try multiple possible font locations
  const possiblePaths = [
    FONT_PATH,
    path.join(
      process.cwd(),
      "packages",
      "lib",
      "fonts",
      "NotoSans-Regular.ttf",
    ),
    path.join(
      process.cwd(),
      "..",
      "..",
      "packages",
      "lib",
      "fonts",
      "NotoSans-Regular.ttf",
    ),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      fontPath = p;
      break;
    }
  }

  const doc = new PDFDocument(options) as PDFKit.PDFDocument;

  // Register custom font if available
  if (fs.existsSync(fontPath)) {
    doc.registerFont("CustomFont", fontPath);
    doc.registerFont("CustomFont-Bold", fontPath); // Use same font, we'll fake bold with stroke
  }

  return doc;
}

/**
 * Add header to PDF
 */
function addHeader(doc: PDFKit.PDFDocument, title: string): void {
  // Black header bar
  doc.rect(0, 0, doc.page.width, 80).fill("#000000");

  // Logo text (since we don't have the actual logo loaded)
  doc
    .font("CustomFont")
    .fontSize(28)
    .fillColor(COLORS.PRIMARY)
    .text("PEXJET", 50, 25);

  // Title
  doc.fontSize(12).fillColor("#FFFFFF").text(title, 50, 55);

  // Reset position
  doc.fillColor("#000000").moveDown(3);
}

/**
 * Add footer to PDF
 */
function addFooter(doc: PDFKit.PDFDocument): void {
  const bottomY = doc.page.height - 60;

  doc
    .fontSize(8)
    .fillColor("#666666")
    .text("PexJet Aviation Services", 50, bottomY, { align: "center" })
    .text("www.pexjet.com | support@pexjet.com", { align: "center" })
    .text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });
}

/**
 * Generate Quote Confirmation PDF
 */
export async function generateQuoteConfirmationPDF(
  data: QuoteConfirmationData,
): Promise<Buffer> {
  const doc = await createPDFDocument({ margin: 50 });

  addHeader(doc, "QUOTE CONFIRMATION");

  // Reference and Date
  doc.y = 100;
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Reference: ${data.referenceNumber}`, 50);
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Date: ${data.createdAt}`);

  doc.moveDown();

  // Client Information
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("CLIENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Details
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Flight Type: ${data.flightType}`);

  doc.moveDown();

  // Legs
  for (const leg of data.legs) {
    doc
      .font("CustomFont")
      .fontSize(10)
      .text(`Leg ${leg.legNumber}: ${leg.departure} → ${leg.arrival}`);
    doc
      .font("CustomFont")
      .fontSize(9)
      .fillColor("#666666")
      .text(`Departure: ${leg.departureDateTime}`)
      .text(`Est. Arrival: ${leg.estimatedArrival}`)
      .text(`Duration: ${leg.duration}`)
      .text(`Aircraft: ${leg.aircraft}`)
      .text(`Price: ${leg.price}`);
    doc.moveDown(0.5);
  }

  doc.moveDown();

  // Total
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(`TOTAL: ${data.totalPrice}`, { align: "right" });

  doc.moveDown(2);

  // Payment Information
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Payment Deadline: ${data.paymentDeadline}`)
    .text("Please complete payment within 3 hours to confirm your booking.");

  doc.moveDown();

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor(COLORS.PRIMARY)
    .text("Payment Link:")
    .font("CustomFont")
    .fillColor("#0066CC")
    .text(data.paymentLink, { link: data.paymentLink });

  addFooter(doc);

  return generatePDFBuffer(doc);
}

/**
 * Generate Flight Confirmation PDF
 */
export async function generateFlightConfirmationPDF(
  data: FlightConfirmationData,
): Promise<Buffer> {
  const doc = await createPDFDocument({ margin: 50 });

  addHeader(doc, "FLIGHT CONFIRMATION");

  // Reference
  doc.y = 100;
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Booking Reference: ${data.referenceNumber}`, 50);
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Payment Reference: ${data.paymentReference}`)
    .text(`Confirmed: ${data.paidAt}`);

  doc.moveDown();

  // Passenger Information
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PASSENGER INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Itinerary
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT ITINERARY");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  for (const leg of data.legs) {
    // Flight card
    doc.rect(50, doc.y, 495, 80).stroke("#CCCCCC");

    const cardY = doc.y + 10;

    // Departure
    doc
      .font("CustomFont")
      .fontSize(16)
      .fillColor("#000000")
      .text(leg.departureCode, 70, cardY);
    doc
      .font("CustomFont")
      .fontSize(9)
      .fillColor("#666666")
      .text(leg.departure, 70, cardY + 20, { width: 150 });
    doc.fontSize(8).text(leg.departureDateTime, 70, cardY + 45);

    // Arrow
    doc
      .font("CustomFont")
      .fontSize(14)
      .fillColor(COLORS.PRIMARY)
      .text("→", 250, cardY + 10);
    doc
      .font("CustomFont")
      .fontSize(8)
      .fillColor("#666666")
      .text(leg.duration, 240, cardY + 30);

    // Arrival
    doc
      .font("CustomFont")
      .fontSize(16)
      .fillColor("#000000")
      .text(leg.arrivalCode, 320, cardY);
    doc
      .font("CustomFont")
      .fontSize(9)
      .fillColor("#666666")
      .text(leg.arrival, 320, cardY + 20, { width: 150 });
    doc.fontSize(8).text(leg.estimatedArrival, 320, cardY + 45);

    // Aircraft
    doc
      .font("CustomFont")
      .fontSize(8)
      .fillColor("#666666")
      .text(`Aircraft: ${leg.aircraft}`, 450, cardY + 10)
      .text(`Passengers: ${leg.passengerCount}`, 450, cardY + 25);

    doc.y += 90;
  }

  doc.moveDown(2);

  // Important Notes
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("IMPORTANT NOTES");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#000000")
    .text("• Please arrive at the FBO at least 30 minutes before departure")
    .text("• Present this confirmation and a valid ID at check-in")
    .text("• Baggage allowance varies by aircraft type")
    .text("• Contact us for any changes or special requests");

  addFooter(doc);

  return generatePDFBuffer(doc);
}

/**
 * Generate Payment Receipt PDF
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const doc = await createPDFDocument({ margin: 50 });

  addHeader(doc, "PAYMENT RECEIPT");

  // Receipt Number
  doc.y = 100;
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Receipt No: ${data.referenceNumber}`, 50);
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Date: ${data.paidAt}`);

  doc.moveDown(2);

  // Paid To
  doc.font("CustomFont").fontSize(12).fillColor(COLORS.PRIMARY).text("PAID TO");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text("PexJet Aviation Services")
    .text("Lagos, Nigeria");

  doc.moveDown();

  // Received From
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("RECEIVED FROM");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Payment Details
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Payment Type: ${data.paymentType}`)
    .text(`Description: ${data.description}`)
    .text(`Payment Method: ${data.paymentMethod}`)
    .text(`Transaction Reference: ${data.transactionReference}`);

  doc.moveDown(2);

  // Amount Box
  doc.rect(350, doc.y, 195, 50).fill("#F5F5F5");
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor("#000000")
    .text("AMOUNT PAID", 360, doc.y + 10);
  doc
    .font("CustomFont")
    .fontSize(18)
    .fillColor(COLORS.PRIMARY)
    .text(data.amount, 360, doc.y + 25);

  doc.y += 70;

  // Status
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#28A745")
    .text("✓ PAYMENT SUCCESSFUL", 50, doc.y, { align: "center" });

  addFooter(doc);

  return generatePDFBuffer(doc);
}

/**
 * Generate Empty Leg Booking Confirmation PDF
 */
export async function generateEmptyLegConfirmationPDF(data: {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  departure: string;
  departureCode: string;
  arrival: string;
  arrivalCode: string;
  departureDateTime: string;
  estimatedArrival: string;
  duration: string;
  aircraft: string;
  seatsBooked: number;
  pricePerSeat: string;
  totalPrice: string;
  paymentDeadline: string;
  paymentLink: string;
}): Promise<Buffer> {
  const doc = await createPDFDocument({ margin: 50 });

  addHeader(doc, "EMPTY LEG BOOKING CONFIRMATION");

  doc.y = 100;
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Reference: ${data.referenceNumber}`, 50);

  doc.moveDown();

  // Client Info
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("CLIENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Details
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  // Flight card
  doc.rect(50, doc.y, 495, 80).stroke("#CCCCCC");
  const cardY = doc.y + 10;

  doc
    .font("CustomFont")
    .fontSize(16)
    .fillColor("#000000")
    .text(data.departureCode, 70, cardY);
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text(data.departure, 70, cardY + 20, { width: 150 });
  doc.fontSize(8).text(data.departureDateTime, 70, cardY + 45);

  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor(COLORS.PRIMARY)
    .text("→", 250, cardY + 10);
  doc
    .font("CustomFont")
    .fontSize(8)
    .fillColor("#666666")
    .text(data.duration, 240, cardY + 30);

  doc
    .font("CustomFont")
    .fontSize(16)
    .fillColor("#000000")
    .text(data.arrivalCode, 320, cardY);
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text(data.arrival, 320, cardY + 20, { width: 150 });
  doc.fontSize(8).text(data.estimatedArrival, 320, cardY + 45);

  doc
    .font("CustomFont")
    .fontSize(8)
    .fillColor("#666666")
    .text(`Aircraft: ${data.aircraft}`, 450, cardY + 10);

  doc.y += 100;

  // Booking Summary
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("BOOKING SUMMARY");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Seats Booked: ${data.seatsBooked}`)
    .text(`Price per Seat: ${data.pricePerSeat}`);

  doc.moveDown();

  doc
    .font("CustomFont")
    .fontSize(14)
    .text(`TOTAL: ${data.totalPrice}`, { align: "right" });

  doc.moveDown(2);

  // Payment
  doc.font("CustomFont").fontSize(12).fillColor(COLORS.PRIMARY).text("PAYMENT");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Payment Deadline: ${data.paymentDeadline}`)
    .text("Complete payment to confirm your booking.");

  doc.moveDown();

  doc
    .font("CustomFont")
    .fillColor(COLORS.PRIMARY)
    .text("Payment Link:")
    .font("CustomFont")
    .fillColor("#0066CC")
    .text(data.paymentLink, { link: data.paymentLink });

  addFooter(doc);

  return generatePDFBuffer(doc);
}

/**
 * Generate Empty Leg Quote with Bank Transfer Details PDF
 */
export async function generateEmptyLegQuotePDF(data: {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  departure: string;
  departureCode: string;
  arrival: string;
  arrivalCode: string;
  departureDateTime: string;
  aircraft: string;
  seatsRequested: number;
  totalPrice: string;
  paymentDeadline: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankSortCode: string;
  proofOfPaymentWhatsApp?: string;
}): Promise<Buffer> {
  const doc = await createPDFDocument({ margin: 50 });

  addHeader(doc, "EMPTY LEG QUOTE CONFIRMATION");

  doc.y = 100;
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Quote Reference: ${data.referenceNumber}`, 50);
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(
      `Date: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
    );

  doc.moveDown();

  // Status Badge
  doc.rect(50, doc.y, 100, 25).fill("#28A745");
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#FFFFFF")
    .text("APPROVED", 75, doc.y + 7);
  doc.y += 35;

  // Client Information
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("CLIENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Details
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  // Flight card
  doc.rect(50, doc.y, 495, 70).stroke("#CCCCCC");
  const quoteCardY = doc.y + 10;

  doc
    .font("CustomFont")
    .fontSize(18)
    .fillColor("#000000")
    .text(data.departureCode, 70, quoteCardY);
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text(data.departure, 70, quoteCardY + 22, { width: 140 });

  doc
    .font("CustomFont")
    .fontSize(20)
    .fillColor(COLORS.PRIMARY)
    .text("✈", 230, quoteCardY + 5);

  doc
    .font("CustomFont")
    .fontSize(18)
    .fillColor("#000000")
    .text(data.arrivalCode, 290, quoteCardY);
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text(data.arrival, 290, quoteCardY + 22, { width: 140 });

  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#000000")
    .text(`${data.departureDateTime}`, 440, quoteCardY + 5)
    .text(`Aircraft: ${data.aircraft}`, 440, quoteCardY + 20)
    .text(`Seats: ${data.seatsRequested}`, 440, quoteCardY + 35);

  doc.y += 85;

  // Pricing
  doc.font("CustomFont").fontSize(12).fillColor(COLORS.PRIMARY).text("PRICING");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc.rect(350, doc.y, 195, 45).fill("#F5F5F5");
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text("Total Amount Due", 360, doc.y + 8);
  doc
    .font("CustomFont")
    .fontSize(20)
    .fillColor(COLORS.PRIMARY)
    .text(data.totalPrice, 360, doc.y + 22);

  doc.y += 60;

  // Bank Details
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("BANK TRANSFER DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc.rect(50, doc.y, 495, 90).fill("#FFF9E6");
  const bankY = doc.y + 10;

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text("Bank Name:", 60, bankY)
    .text("Account Name:", 60, bankY + 18)
    .text("Account Number:", 60, bankY + 36)
    .text("Sort Code:", 60, bankY + 54);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#333333")
    .text(data.bankName, 180, bankY)
    .text(data.bankAccountName, 180, bankY + 18)
    .text(data.bankAccountNumber, 180, bankY + 36)
    .text(data.bankSortCode, 180, bankY + 54);

  doc.y += 105;

  // Payment Instructions
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT INSTRUCTIONS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(
      `1. Transfer the exact amount of ${data.totalPrice} to the bank account above`,
    )
    .text(`2. Use reference: ${data.referenceNumber}`)
    .text("3. After payment, send your payment receipt/screenshot via WhatsApp")
    .text(`4. Payment must be completed by: ${data.paymentDeadline}`);

  if (data.proofOfPaymentWhatsApp) {
    doc.moveDown();
    doc
      .font("CustomFont")
      .fontSize(10)
      .fillColor(COLORS.PRIMARY)
      .text("Send proof of payment to:")
      .font("CustomFont")
      .text(data.proofOfPaymentWhatsApp);
  }

  doc.moveDown();

  // Warning
  doc.rect(50, doc.y, 495, 30).fill("#FFEBEE");
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#C62828")
    .text(
      "⚠ IMPORTANT: Quote expires if payment is not received by the deadline.",
      60,
      doc.y + 10,
    );

  addFooter(doc);

  return generatePDFBuffer(doc);
}

/**
 * Generate Empty Leg Flight Ticket PDF
 */
export async function generateEmptyLegTicketPDF(data: {
  ticketNumber: string;
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  departure: string;
  departureCode: string;
  arrival: string;
  arrivalCode: string;
  departureDateTime: string;
  checkInTime: string;
  aircraft: string;
  seatsBooked: number;
  totalPaid: string;
  paidAt: string;
}): Promise<Buffer> {
  const doc = await createPDFDocument({ margin: 50 });

  addHeader(doc, "E-TICKET / BOARDING PASS");

  doc.y = 100;

  // Ticket Number prominent display
  doc.rect(50, doc.y, 495, 40).fill("#000000");
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor("#FFFFFF")
    .text("TICKET NUMBER", 60, doc.y + 8);
  doc
    .font("CustomFont")
    .fontSize(16)
    .fillColor(COLORS.PRIMARY)
    .text(data.ticketNumber, 60, doc.y + 22);

  doc.y += 55;

  // Passenger Details
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PASSENGER");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(data.clientName.toUpperCase());
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Phone: ${data.clientPhone}`)
    .text(`Email: ${data.clientEmail}`);

  doc.moveDown();

  // Flight Details Card
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  // Large flight card
  doc.rect(50, doc.y, 495, 100).stroke(COLORS.PRIMARY);
  const ticketFlightY = doc.y + 15;

  // Departure
  doc
    .font("CustomFont")
    .fontSize(28)
    .fillColor("#000000")
    .text(data.departureCode, 80, ticketFlightY);
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(data.departure, 80, ticketFlightY + 35, { width: 150 });
  doc.fontSize(9).text(data.departureDateTime, 80, ticketFlightY + 60);

  // Plane icon and line
  doc
    .moveTo(200, ticketFlightY + 20)
    .lineTo(280, ticketFlightY + 20)
    .stroke("#CCCCCC");
  doc
    .font("CustomFont")
    .fontSize(24)
    .fillColor(COLORS.PRIMARY)
    .text("✈", 290, ticketFlightY + 5);
  doc
    .moveTo(320, ticketFlightY + 20)
    .lineTo(400, ticketFlightY + 20)
    .stroke("#CCCCCC");

  // Arrival
  doc
    .font("CustomFont")
    .fontSize(28)
    .fillColor("#000000")
    .text(data.arrivalCode, 420, ticketFlightY);
  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#666666")
    .text(data.arrival, 420, ticketFlightY + 35, { width: 150 });

  doc.y += 115;

  // Check-in and Aircraft Info
  doc.rect(50, doc.y, 240, 60).fill("#F5F5F5");
  doc.rect(305, doc.y, 240, 60).fill("#F5F5F5");

  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text("CHECK-IN TIME", 60, doc.y + 10);
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(data.checkInTime, 60, doc.y + 25);
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text("Arrive 2 hours before departure", 60, doc.y + 42);

  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text("AIRCRAFT", 315, doc.y + 10);
  doc
    .font("CustomFont")
    .fontSize(14)
    .fillColor("#000000")
    .text(data.aircraft, 315, doc.y + 25);
  doc
    .font("CustomFont")
    .fontSize(9)
    .fillColor("#666666")
    .text(`${data.seatsBooked} Passenger(s)`, 315, doc.y + 42);

  doc.y += 75;

  // Payment Confirmation
  doc
    .font("CustomFont")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT CONFIRMED");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("CustomFont")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Amount Paid: ${data.totalPaid}`)
    .text(`Payment Date: ${data.paidAt}`)
    .text(`Booking Reference: ${data.referenceNumber}`);

  doc.moveDown();

  // Terms
  doc.rect(50, doc.y, 495, 50).fill("#E3F2FD");
  doc
    .font("CustomFont")
    .fontSize(8)
    .fillColor("#1565C0")
    .text(
      "✓ Please arrive at the FBO/Private Terminal at least 2 hours before departure",
      60,
      doc.y + 8,
    )
    .text(
      "✓ Present this ticket along with a valid government-issued ID",
      60,
      doc.y + 20,
    )
    .text(
      "✓ Contact us immediately for any changes or cancellations",
      60,
      doc.y + 32,
    );

  addFooter(doc);

  return generatePDFBuffer(doc);
}
