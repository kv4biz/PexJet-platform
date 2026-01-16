import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || "eu";

let cachedPusher: Pusher | null = null;

function getPusherClient(): Pusher {
  if (!appId || !key || !secret) {
    throw new Error(
      "Pusher credentials not configured. Set PUSHER_APP_ID, PUSHER_KEY, and PUSHER_SECRET.",
    );
  }

  if (!cachedPusher) {
    cachedPusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return cachedPusher;
}

export interface PusherEvent {
  channel: string;
  event: string;
  data: Record<string, any>;
}

/**
 * Trigger a Pusher event
 */
export async function triggerPusherEvent({
  channel,
  event,
  data,
}: PusherEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const pusher = getPusherClient();
    await pusher.trigger(channel, event, data);
    return { success: true };
  } catch (error: any) {
    console.error("Pusher trigger error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger multiple events at once (batch)
 */
export async function triggerPusherBatch(
  events: PusherEvent[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const pusher = getPusherClient();
    await pusher.triggerBatch(
      events.map((e) => ({
        channel: e.channel,
        name: e.event,
        data: e.data,
      })),
    );
    return { success: true };
  } catch (error: any) {
    console.error("Pusher batch trigger error:", error);
    return { success: false, error: error.message };
  }
}

// Channel naming conventions
export const PUSHER_CHANNELS = {
  ADMIN_NOTIFICATIONS: "admin-notifications",
  BOOKING_MESSAGES: (bookingId: string) => `booking-${bookingId}`,
  QUOTES: "quotes",
  EMPTY_LEGS: "empty-legs",
} as const;

// Event naming conventions
export const PUSHER_EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_STATUS_UPDATE: "message-status-update",
  NEW_BOOKING: "new-booking",
  BOOKING_STATUS_UPDATE: "booking-status-update",
  NEW_QUOTE: "new-quote",
  QUOTE_STATUS_UPDATE: "quote-status-update",
  RECEIPT_UPLOADED: "receipt-uploaded",
  PAYMENT_CONFIRMED: "payment-confirmed",
} as const;

/**
 * Notify about a new message in a booking chat
 */
export async function notifyNewMessage(
  bookingId: string,
  message: {
    id: string;
    direction: string;
    content: string | null;
    mediaUrl: string | null;
    sentAt: Date;
  },
): Promise<void> {
  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.BOOKING_MESSAGES(bookingId),
    event: PUSHER_EVENTS.NEW_MESSAGE,
    data: message,
  });

  // Also notify admin channel for badge updates
  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.ADMIN_NOTIFICATIONS,
    event: PUSHER_EVENTS.NEW_MESSAGE,
    data: { bookingId, direction: message.direction },
  });
}

/**
 * Notify about a new empty leg booking
 */
export async function notifyNewEmptyLegBooking(booking: {
  id: string;
  referenceNumber: string;
  clientName: string;
  status: string;
  createdAt: Date;
}): Promise<void> {
  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.QUOTES,
    event: PUSHER_EVENTS.NEW_BOOKING,
    data: booking,
  });

  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.ADMIN_NOTIFICATIONS,
    event: PUSHER_EVENTS.NEW_BOOKING,
    data: { type: "empty-leg", ...booking },
  });
}

/**
 * Notify about booking status update
 */
export async function notifyBookingStatusUpdate(
  bookingId: string,
  status: string,
  referenceNumber: string,
): Promise<void> {
  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.BOOKING_MESSAGES(bookingId),
    event: PUSHER_EVENTS.BOOKING_STATUS_UPDATE,
    data: { bookingId, status, referenceNumber },
  });

  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.QUOTES,
    event: PUSHER_EVENTS.BOOKING_STATUS_UPDATE,
    data: { bookingId, status, referenceNumber },
  });
}

/**
 * Notify about receipt upload
 */
export async function notifyReceiptUploaded(booking: {
  id: string;
  referenceNumber: string;
  clientName: string;
  receiptUrl: string;
}): Promise<void> {
  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.BOOKING_MESSAGES(booking.id),
    event: PUSHER_EVENTS.RECEIPT_UPLOADED,
    data: booking,
  });

  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.ADMIN_NOTIFICATIONS,
    event: PUSHER_EVENTS.RECEIPT_UPLOADED,
    data: booking,
  });
}

/**
 * Notify about payment confirmation
 */
export async function notifyPaymentConfirmed(booking: {
  id: string;
  referenceNumber: string;
  ticketNumber: string;
  clientName: string;
}): Promise<void> {
  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.BOOKING_MESSAGES(booking.id),
    event: PUSHER_EVENTS.PAYMENT_CONFIRMED,
    data: booking,
  });

  await triggerPusherEvent({
    channel: PUSHER_CHANNELS.QUOTES,
    event: PUSHER_EVENTS.PAYMENT_CONFIRMED,
    data: booking,
  });
}
