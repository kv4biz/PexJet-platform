import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";

const client = twilio(accountSid, authToken);

interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
}

/**
 * Format phone number for WhatsApp
 */
function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, "");
  
  // Ensure it starts with +
  if (!formatted.startsWith("+")) {
    // Assume Nigerian number if starts with 0
    if (formatted.startsWith("0")) {
      formatted = "+234" + formatted.slice(1);
    } else {
      formatted = "+" + formatted;
    }
  }
  
  return `whatsapp:${formatted}`;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage({
  to,
  message,
  mediaUrl,
}: WhatsAppMessage): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const messageOptions: any = {
      from: `whatsapp:${whatsappNumber}`,
      to: formatWhatsAppNumber(to),
      body: message,
    };

    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(messageOptions);
    
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP via WhatsApp
 */
export async function sendOTPWhatsApp(
  phone: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const message = `Your PexJet verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share this code with anyone.`;
  
  return sendWhatsAppMessage({ to: phone, message });
}

/**
 * Send quote notification to admins
 */
export async function notifyAdminsNewQuote(
  adminPhones: string[],
  quoteDetails: {
    referenceNumber: string;
    clientName: string;
    flightType: string;
    departure: string;
    arrival: string;
    date: string;
  }
): Promise<void> {
  const message = `🛩️ *New Charter Quote Request*

Reference: ${quoteDetails.referenceNumber}
Client: ${quoteDetails.clientName}
Type: ${quoteDetails.flightType}
Route: ${quoteDetails.departure} → ${quoteDetails.arrival}
Date: ${quoteDetails.date}

Please review in the admin dashboard.`;

  for (const phone of adminPhones) {
    await sendWhatsAppMessage({ to: phone, message });
  }
}

/**
 * Send quote approval notification to client
 */
export async function sendQuoteApprovalNotification(
  phone: string,
  details: {
    referenceNumber: string;
    totalPrice: string;
    paymentDeadline: string;
    paymentLink: string;
  },
  documentUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const message = `✅ *Quote Approved - PexJet*

Your charter quote has been approved!

Reference: ${details.referenceNumber}
Total: ${details.totalPrice}

⏰ Payment Deadline: ${details.paymentDeadline}

Please complete payment within 3 hours to confirm your booking.

🔗 Payment Link: ${details.paymentLink}

Thank you for choosing PexJet!`;

  return sendWhatsAppMessage({ to: phone, message, mediaUrl: documentUrl });
}

/**
 * Send quote rejection notification to client
 */
export async function sendQuoteRejectionNotification(
  phone: string,
  details: {
    referenceNumber: string;
    reason: string;
    note?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  let message = `❌ *Quote Update - PexJet*

We regret to inform you that your quote request could not be processed.

Reference: ${details.referenceNumber}
Reason: ${details.reason}`;

  if (details.note) {
    message += `\nNote: ${details.note}`;
  }

  message += `\n\nPlease contact us for alternative options or submit a new request.

Thank you for your understanding.`;

  return sendWhatsAppMessage({ to: phone, message });
}

/**
 * Send payment confirmation to client
 */
export async function sendPaymentConfirmation(
  phone: string,
  details: {
    referenceNumber: string;
    amount: string;
    flightDetails: string;
  },
  receiptUrl?: string,
  flightDocUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const message = `🎉 *Payment Confirmed - PexJet*

Thank you for your payment!

Reference: ${details.referenceNumber}
Amount: ${details.amount}

${details.flightDetails}

Your flight confirmation documents have been sent to your email.

Safe travels! ✈️`;

  // Send message with receipt
  const result = await sendWhatsAppMessage({ to: phone, message, mediaUrl: receiptUrl });
  
  // Send flight document separately if provided
  if (flightDocUrl && result.success) {
    await sendWhatsAppMessage({
      to: phone,
      message: "📄 Your flight confirmation document:",
      mediaUrl: flightDocUrl,
    });
  }
  
  return result;
}

/**
 * Send empty leg deal notification to subscribers
 */
export async function sendEmptyLegNotification(
  phones: string[],
  deal: {
    departure: string;
    arrival: string;
    date: string;
    price: string;
    seatsAvailable: number;
    link: string;
  }
): Promise<void> {
  const message = `✨ *New Empty Leg Deal - PexJet*

🛫 ${deal.departure} → ${deal.arrival}
📅 ${deal.date}
💰 From ${deal.price}/seat
🪑 ${deal.seatsAvailable} seats available

Book now before it's gone!
🔗 ${deal.link}`;

  for (const phone of phones) {
    await sendWhatsAppMessage({ to: phone, message });
  }
}

/**
 * Send announcement to all clients
 */
export async function sendAnnouncement(
  phones: string[],
  announcement: {
    title: string;
    message: string;
    imageUrl?: string;
  }
): Promise<void> {
  const message = `📢 *${announcement.title}*

${announcement.message}

- PexJet Team`;

  for (const phone of phones) {
    await sendWhatsAppMessage({
      to: phone,
      message,
      mediaUrl: announcement.imageUrl,
    });
  }
}
