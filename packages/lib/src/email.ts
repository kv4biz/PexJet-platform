import nodemailer from "nodemailer";

// Transporter for financial emails (receipts)
const financesTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.privateemail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_FINANCES_USER,
    pass: process.env.SMTP_FINANCES_PASS,
  },
});

// Transporter for inquiry emails (documents, quotes)
const inquiriesTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.privateemail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_INQUIRIES_USER,
    pass: process.env.SMTP_INQUIRIES_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

/**
 * Send email from finances account (for receipts)
 */
export async function sendFinancesEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    await financesTransporter.sendMail({
      from: `"PexJet Finances" <${process.env.SMTP_FINANCES_USER}>`,
      ...options,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email from inquiries account (for documents, quotes)
 */
export async function sendInquiriesEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    await inquiriesTransporter.sendMail({
      from: `"PexJet" <${process.env.SMTP_INQUIRIES_USER}>`,
      ...options,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send quote confirmation email
 */
export async function sendQuoteConfirmationEmail(
  to: string,
  details: {
    clientName: string;
    referenceNumber: string;
    flightDetails: string;
    totalPrice: string;
    paymentDeadline: string;
    paymentLink: string;
  },
  pdfBuffer?: Buffer
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #C9A227; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background: #C9A227; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; }
    .details { background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #C9A227; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PexJet</h1>
      <p>Quote Confirmation</p>
    </div>
    <div class="content">
      <p>Dear ${details.clientName},</p>
      <p>Your charter quote has been approved! Please find the details below:</p>
      
      <div class="details">
        <p><strong>Reference:</strong> ${details.referenceNumber}</p>
        ${details.flightDetails}
        <p><strong>Total Price:</strong> ${details.totalPrice}</p>
      </div>
      
      <p><strong>⏰ Payment Deadline:</strong> ${details.paymentDeadline}</p>
      <p>Please complete your payment within 3 hours to confirm your booking.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${details.paymentLink}" class="button">Complete Payment</a>
      </p>
    </div>
    <div class="footer">
      <p>Thank you for choosing PexJet</p>
      <p>© ${new Date().getFullYear()} PexJet. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const attachments = pdfBuffer
    ? [{ filename: `Quote-${details.referenceNumber}.pdf`, content: pdfBuffer }]
    : undefined;

  return sendInquiriesEmail({ to, subject: `Quote Approved - ${details.referenceNumber}`, html, attachments });
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  to: string,
  details: {
    clientName: string;
    referenceNumber: string;
    amount: string;
    paymentDate: string;
    flightDetails: string;
  },
  receiptPdf?: Buffer,
  flightConfirmPdf?: Buffer
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #C9A227; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .success { background: #d4edda; color: #155724; padding: 15px; text-align: center; margin-bottom: 20px; }
    .details { background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #C9A227; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PexJet</h1>
      <p>Payment Receipt</p>
    </div>
    <div class="content">
      <div class="success">
        <h2>✅ Payment Successful</h2>
      </div>
      
      <p>Dear ${details.clientName},</p>
      <p>Thank you for your payment. Your booking has been confirmed!</p>
      
      <div class="details">
        <p><strong>Reference:</strong> ${details.referenceNumber}</p>
        <p><strong>Amount Paid:</strong> ${details.amount}</p>
        <p><strong>Payment Date:</strong> ${details.paymentDate}</p>
      </div>
      
      <div class="details">
        <h3>Flight Details</h3>
        ${details.flightDetails}
      </div>
      
      <p>Your receipt and flight confirmation documents are attached to this email.</p>
      <p>Please keep these documents for your records and present them at the airport.</p>
    </div>
    <div class="footer">
      <p>Safe travels! ✈️</p>
      <p>© ${new Date().getFullYear()} PexJet. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const attachments: Array<{ filename: string; content: Buffer }> = [];
  if (receiptPdf) {
    attachments.push({ filename: `Receipt-${details.referenceNumber}.pdf`, content: receiptPdf });
  }
  if (flightConfirmPdf) {
    attachments.push({ filename: `FlightConfirmation-${details.referenceNumber}.pdf`, content: flightConfirmPdf });
  }

  return sendFinancesEmail({
    to,
    subject: `Payment Confirmed - ${details.referenceNumber}`,
    html,
    attachments,
  });
}

/**
 * Send quote rejection email
 */
export async function sendQuoteRejectionEmail(
  to: string,
  details: {
    clientName: string;
    referenceNumber: string;
    reason: string;
    note?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #C9A227; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .notice { background: #fff3cd; color: #856404; padding: 15px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PexJet</h1>
      <p>Quote Update</p>
    </div>
    <div class="content">
      <p>Dear ${details.clientName},</p>
      
      <div class="notice">
        <p>We regret to inform you that your quote request could not be processed at this time.</p>
      </div>
      
      <p><strong>Reference:</strong> ${details.referenceNumber}</p>
      <p><strong>Reason:</strong> ${details.reason}</p>
      ${details.note ? `<p><strong>Note:</strong> ${details.note}</p>` : ""}
      
      <p>We apologize for any inconvenience. Please feel free to submit a new request or contact us for alternative options.</p>
    </div>
    <div class="footer">
      <p>Thank you for your understanding.</p>
      <p>© ${new Date().getFullYear()} PexJet. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendInquiriesEmail({ to, subject: `Quote Update - ${details.referenceNumber}`, html });
}

/**
 * Send welcome email to new admin/operator
 */
export async function sendWelcomeEmail(
  to: string,
  details: {
    name: string;
    username: string;
    password: string;
    role: string;
    loginUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #C9A227; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .credentials { background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #C9A227; }
    .button { display: inline-block; background: #C9A227; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PexJet</h1>
      <p>Welcome to the Team!</p>
    </div>
    <div class="content">
      <p>Dear ${details.name},</p>
      <p>Your ${details.role} account has been created. Here are your login credentials:</p>
      
      <div class="credentials">
        <p><strong>Username:</strong> ${details.username}</p>
        <p><strong>Password:</strong> ${details.password}</p>
      </div>
      
      <p><strong>⚠️ Important:</strong> Please change your password after your first login.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${details.loginUrl}" class="button">Login Now</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PexJet. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendInquiriesEmail({ to, subject: "Welcome to PexJet", html });
}
