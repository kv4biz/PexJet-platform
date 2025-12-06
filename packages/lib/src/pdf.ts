import PDFDocument from "pdfkit";
import { COLORS } from "./constants";

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

/**
 * Add header to PDF
 */
function addHeader(doc: PDFKit.PDFDocument, title: string): void {
  // Black header bar
  doc.rect(0, 0, doc.page.width, 80).fill("#000000");

  // Logo text (since we don't have the actual logo loaded)
  doc
    .font("Helvetica-Bold")
    .fontSize(28)
    .fillColor(COLORS.PRIMARY)
    .text("PEXJET", 50, 25);

  // Title
  doc
    .fontSize(12)
    .fillColor("#FFFFFF")
    .text(title, 50, 55);

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
  data: QuoteConfirmationData
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });

  addHeader(doc, "QUOTE CONFIRMATION");

  // Reference and Date
  doc.y = 100;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Reference: ${data.referenceNumber}`, 50);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Date: ${data.createdAt}`);

  doc.moveDown();

  // Client Information
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("CLIENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Details
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Flight Type: ${data.flightType}`);

  doc.moveDown();

  // Legs
  for (const leg of data.legs) {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Leg ${leg.legNumber}: ${leg.departure} → ${leg.arrival}`);
    doc
      .font("Helvetica")
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
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#000000")
    .text(`TOTAL: ${data.totalPrice}`, { align: "right" });

  doc.moveDown(2);

  // Payment Information
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Payment Deadline: ${data.paymentDeadline}`)
    .text("Please complete payment within 3 hours to confirm your booking.");

  doc.moveDown();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.PRIMARY)
    .text("Payment Link:")
    .font("Helvetica")
    .fillColor("#0066CC")
    .text(data.paymentLink, { link: data.paymentLink });

  addFooter(doc);

  return generatePDFBuffer(doc);
}

/**
 * Generate Flight Confirmation PDF
 */
export async function generateFlightConfirmationPDF(
  data: FlightConfirmationData
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });

  addHeader(doc, "FLIGHT CONFIRMATION");

  // Reference
  doc.y = 100;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Booking Reference: ${data.referenceNumber}`, 50);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Payment Reference: ${data.paymentReference}`)
    .text(`Confirmed: ${data.paidAt}`);

  doc.moveDown();

  // Passenger Information
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PASSENGER INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Itinerary
  doc
    .font("Helvetica-Bold")
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
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000000")
      .text(leg.departureCode, 70, cardY);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666666")
      .text(leg.departure, 70, cardY + 20, { width: 150 });
    doc.fontSize(8).text(leg.departureDateTime, 70, cardY + 45);

    // Arrow
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(COLORS.PRIMARY)
      .text("→", 250, cardY + 10);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#666666")
      .text(leg.duration, 240, cardY + 30);

    // Arrival
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000000")
      .text(leg.arrivalCode, 320, cardY);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666666")
      .text(leg.arrival, 320, cardY + 20, { width: 150 });
    doc.fontSize(8).text(leg.estimatedArrival, 320, cardY + 45);

    // Aircraft
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#666666")
      .text(`Aircraft: ${leg.aircraft}`, 450, cardY + 10)
      .text(`Passengers: ${leg.passengerCount}`, 450, cardY + 25);

    doc.y += 90;
  }

  doc.moveDown(2);

  // Important Notes
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("IMPORTANT NOTES");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
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
  const doc = new PDFDocument({ margin: 50 });

  addHeader(doc, "PAYMENT RECEIPT");

  // Receipt Number
  doc.y = 100;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Receipt No: ${data.referenceNumber}`, 50);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#666666")
    .text(`Date: ${data.paidAt}`);

  doc.moveDown(2);

  // Paid To
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAID TO");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text("PexJet Aviation Services")
    .text("Lagos, Nigeria");

  doc.moveDown();

  // Received From
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("RECEIVED FROM");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Payment Details
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
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
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#000000")
    .text("AMOUNT PAID", 360, doc.y + 10);
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.PRIMARY)
    .text(data.amount, 360, doc.y + 25);

  doc.y += 70;

  // Status
  doc
    .font("Helvetica-Bold")
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
  const doc = new PDFDocument({ margin: 50 });

  addHeader(doc, "EMPTY LEG BOOKING CONFIRMATION");

  doc.y = 100;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#000000")
    .text(`Reference: ${data.referenceNumber}`, 50);

  doc.moveDown();

  // Client Info
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("CLIENT INFORMATION");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Name: ${data.clientName}`)
    .text(`Email: ${data.clientEmail}`)
    .text(`Phone: ${data.clientPhone}`);

  doc.moveDown();

  // Flight Details
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("FLIGHT DETAILS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  // Flight card
  doc.rect(50, doc.y, 495, 80).stroke("#CCCCCC");
  const cardY = doc.y + 10;

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#000000")
    .text(data.departureCode, 70, cardY);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666666")
    .text(data.departure, 70, cardY + 20, { width: 150 });
  doc.fontSize(8).text(data.departureDateTime, 70, cardY + 45);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.PRIMARY)
    .text("→", 250, cardY + 10);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#666666")
    .text(data.duration, 240, cardY + 30);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#000000")
    .text(data.arrivalCode, 320, cardY);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666666")
    .text(data.arrival, 320, cardY + 20, { width: 150 });
  doc.fontSize(8).text(data.estimatedArrival, 320, cardY + 45);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#666666")
    .text(`Aircraft: ${data.aircraft}`, 450, cardY + 10);

  doc.y += 100;

  // Booking Summary
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("BOOKING SUMMARY");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Seats Booked: ${data.seatsBooked}`)
    .text(`Price per Seat: ${data.pricePerSeat}`);

  doc.moveDown();

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(`TOTAL: ${data.totalPrice}`, { align: "right" });

  doc.moveDown(2);

  // Payment
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.PRIMARY)
    .text("PAYMENT");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(COLORS.PRIMARY);
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Payment Deadline: ${data.paymentDeadline}`)
    .text("Complete payment to confirm your booking.");

  doc.moveDown();

  doc
    .font("Helvetica-Bold")
    .fillColor(COLORS.PRIMARY)
    .text("Payment Link:")
    .font("Helvetica")
    .fillColor("#0066CC")
    .text(data.paymentLink, { link: data.paymentLink });

  addFooter(doc);

  return generatePDFBuffer(doc);
}
