"use client";

import { useEffect, useCallback, useRef } from "react";
import Pusher from "pusher-js";

let pusherInstance: Pusher | null = null;

function getPusherClient(): Pusher {
  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

    if (!key) {
      throw new Error("NEXT_PUBLIC_PUSHER_KEY is not configured");
    }

    pusherInstance = new Pusher(key, {
      cluster,
    });
  }

  return pusherInstance;
}

// Channel naming conventions (must match server-side)
export const PUSHER_CHANNELS = {
  ADMIN_NOTIFICATIONS: "admin-notifications",
  BOOKING_MESSAGES: (bookingId: string) => `booking-${bookingId}`,
  QUOTES: "quotes",
  EMPTY_LEGS: "empty-legs",
} as const;

// Event naming conventions (must match server-side)
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

interface UsePusherOptions {
  channel: string;
  event: string;
  onEvent: (data: any) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to a Pusher channel and listen for events
 */
export function usePusher({
  channel,
  event,
  onEvent,
  enabled = true,
}: UsePusherOptions) {
  const callbackRef = useRef(onEvent);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    try {
      const pusher = getPusherClient();
      const channelInstance = pusher.subscribe(channel);

      const handler = (data: any) => {
        callbackRef.current(data);
      };

      channelInstance.bind(event, handler);

      return () => {
        channelInstance.unbind(event, handler);
        pusher.unsubscribe(channel);
      };
    } catch (error) {
      console.error("Pusher subscription error:", error);
    }
  }, [channel, event, enabled]);
}

/**
 * Hook to subscribe to booking chat messages
 */
export function useBookingMessages(
  bookingId: string | null,
  onNewMessage: (message: any) => void,
) {
  usePusher({
    channel: bookingId ? PUSHER_CHANNELS.BOOKING_MESSAGES(bookingId) : "",
    event: PUSHER_EVENTS.NEW_MESSAGE,
    onEvent: onNewMessage,
    enabled: !!bookingId,
  });
}

/**
 * Hook to subscribe to admin notifications
 */
export function useAdminNotifications(callbacks: {
  onNewMessage?: (data: { bookingId: string; direction: string }) => void;
  onNewBooking?: (data: any) => void;
  onReceiptUploaded?: (data: any) => void;
}) {
  usePusher({
    channel: PUSHER_CHANNELS.ADMIN_NOTIFICATIONS,
    event: PUSHER_EVENTS.NEW_MESSAGE,
    onEvent: callbacks.onNewMessage || (() => {}),
    enabled: !!callbacks.onNewMessage,
  });

  usePusher({
    channel: PUSHER_CHANNELS.ADMIN_NOTIFICATIONS,
    event: PUSHER_EVENTS.NEW_BOOKING,
    onEvent: callbacks.onNewBooking || (() => {}),
    enabled: !!callbacks.onNewBooking,
  });

  usePusher({
    channel: PUSHER_CHANNELS.ADMIN_NOTIFICATIONS,
    event: PUSHER_EVENTS.RECEIPT_UPLOADED,
    onEvent: callbacks.onReceiptUploaded || (() => {}),
    enabled: !!callbacks.onReceiptUploaded,
  });
}

/**
 * Hook to subscribe to quote updates
 */
export function useQuoteUpdates(callbacks: {
  onBookingStatusUpdate?: (data: any) => void;
  onPaymentConfirmed?: (data: any) => void;
}) {
  usePusher({
    channel: PUSHER_CHANNELS.QUOTES,
    event: PUSHER_EVENTS.BOOKING_STATUS_UPDATE,
    onEvent: callbacks.onBookingStatusUpdate || (() => {}),
    enabled: !!callbacks.onBookingStatusUpdate,
  });

  usePusher({
    channel: PUSHER_CHANNELS.QUOTES,
    event: PUSHER_EVENTS.PAYMENT_CONFIRMED,
    onEvent: callbacks.onPaymentConfirmed || (() => {}),
    enabled: !!callbacks.onPaymentConfirmed,
  });
}

/**
 * Hook to subscribe to admin-specific notifications (for the logged-in admin only)
 */
export function useAdminPersonalNotifications(
  adminId: string | null,
  onClientMessage: (data: {
    bookingId: string;
    bookingType: string;
    referenceNumber: string;
    clientName: string;
    message: string;
    timestamp: string;
  }) => void,
) {
  usePusher({
    channel: adminId ? `admin-${adminId}` : "",
    event: "new-client-message",
    onEvent: onClientMessage,
    enabled: !!adminId,
  });
}
