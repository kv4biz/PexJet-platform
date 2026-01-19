"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useToast,
} from "@pexjet/ui";
import {
  X,
  Plane,
  Calendar,
  Users,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Check,
  XCircle,
  CreditCard,
  FileText,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import BookingChat from "./BookingChat";

interface EmptyLegQuote {
  id: string;
  referenceNumber: string;
  status: string;
  totalPriceUsd: number | null;
  seatsRequested: number;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  receiptUrl?: string | null;
  source: string;
  emptyLeg: {
    id: string;
    departureDateTime: string;
    departureAirport: { name: string; icaoCode: string; municipality?: string };
    arrivalAirport: { name: string; icaoCode: string; municipality?: string };
    aircraft: { name: string; manufacturer?: string } | null;
    priceUsd?: number | null;
    availableSeats?: number;
  };
}

interface EmptyLegQuoteDetailProps {
  quote: EmptyLegQuote;
  onClose: () => void;
  onRefresh: () => void;
}

const REJECTION_REASONS = [
  { value: "AIRCRAFT_UNAVAILABLE", label: "Aircraft Unavailable" },
  { value: "ROUTE_NOT_SERVICEABLE", label: "Route Not Serviceable" },
  { value: "INVALID_DATES", label: "Invalid Dates" },
  { value: "PRICING_ISSUE", label: "Pricing Issue" },
  { value: "CAPACITY_EXCEEDED", label: "Capacity Exceeded" },
  { value: "DEAL_NOT_AVAILABLE", label: "Deal Not Available" },
  { value: "OTHER", label: "Other" },
];

export default function EmptyLegQuoteDetail({
  quote,
  onClose,
  onRefresh,
}: EmptyLegQuoteDetailProps) {
  const { toast } = useToast();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showConfirmPaymentDialog, setShowConfirmPaymentDialog] =
    useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [priceUsd, setPriceUsd] = useState(
    quote.totalPriceUsd?.toString() || "",
  );

  const handleApprove = async () => {
    if (!priceUsd || isNaN(parseFloat(priceUsd))) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      setApproving(true);
      const response = await fetch(
        `/api/quotes/empty-leg/${quote.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            totalPriceUsd: parseFloat(priceUsd),
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Quote Approved",
          description: "Quote confirmation sent to client via WhatsApp",
        });
        setShowApproveDialog(false);
        onRefresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to approve quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve quote",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast({
        title: "Error",
        description: "Please select a rejection reason",
        variant: "destructive",
      });
      return;
    }

    try {
      setRejecting(true);
      const response = await fetch(`/api/quotes/empty-leg/${quote.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          rejectionReason,
          rejectionNote,
        }),
      });

      if (response.ok) {
        toast({
          title: "Quote Rejected",
          description: "Rejection message sent to client",
        });
        setShowRejectDialog(false);
        onRefresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to reject quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject quote",
        variant: "destructive",
      });
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirmingPayment(true);
      const response = await fetch(
        `/api/quotes/empty-leg/${quote.id}/confirm-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.ok) {
        toast({
          title: "Payment Confirmed",
          description: "Flight confirmation sent to client via WhatsApp",
        });
        setShowConfirmPaymentDialog(false);
        onRefresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to confirm payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "PAID":
        return "default";
      case "COMPLETED":
        return "success";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-4 px-4 border-b flex-shrink-0">
        <section className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Quote Details</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </section>
        <section className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="font-mono">
            {quote.referenceNumber}
          </Badge>
          <Badge variant={getStatusColor(quote.status) as any}>
            {quote.status}
          </Badge>
          {quote.source === "INSTACHARTER" && (
            <Badge variant="secondary">InstaCharter</Badge>
          )}
        </section>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Client Info */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Client Information
          </h3>
          <article className="space-y-2">
            <p className="font-medium">{quote.clientName}</p>
            <section className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {quote.clientEmail}
            </section>
            <section className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {quote.clientPhone}
            </section>
          </article>
        </section>

        <Separator />

        {/* Flight Details */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Flight Details
          </h3>
          <article className="space-y-2">
            <section className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {quote.emptyLeg.departureAirport.municipality ||
                  quote.emptyLeg.departureAirport.name}{" "}
                ({quote.emptyLeg.departureAirport.icaoCode})
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">
                {quote.emptyLeg.arrivalAirport.municipality ||
                  quote.emptyLeg.arrivalAirport.name}{" "}
                ({quote.emptyLeg.arrivalAirport.icaoCode})
              </span>
            </section>
            <section className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDateTime(quote.emptyLeg.departureDateTime)}
            </section>
            {quote.emptyLeg.aircraft && (
              <section className="flex items-center gap-2 text-sm">
                <Plane className="h-4 w-4 text-muted-foreground" />
                {quote.emptyLeg.aircraft.name}
              </section>
            )}
            <section className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              {quote.seatsRequested} seat(s) requested
            </section>
          </article>
        </section>

        <Separator />

        {/* Pricing */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pricing
          </h3>
          <section className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {quote.totalPriceUsd
                ? `$${quote.totalPriceUsd.toLocaleString()}`
                : "Not set"}
            </span>
          </section>
        </section>

        <Separator />

        {/* Receipt (if uploaded) */}
        {quote.receiptUrl && (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Payment Receipt
              </h3>
              <a
                href={quote.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={quote.receiptUrl}
                  alt="Payment Receipt"
                  className="max-w-full rounded border max-h-48 object-cover"
                />
                <section className="flex items-center gap-1 mt-2 text-sm text-primary">
                  <ExternalLink className="h-4 w-4" />
                  View Full Image
                </section>
              </a>
            </section>
            <Separator />
          </>
        )}

        {/* Chat Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Conversation
          </h3>
          <BookingChat
            bookingId={quote.id}
            bookingType="empty_leg"
            clientName={quote.clientName}
            clientPhone={quote.clientPhone}
            onMessageSent={onRefresh}
          />
        </section>

        {/* Action Buttons */}
        <section className="space-y-3 pt-4">
          {quote.status === "PENDING" && (
            <section className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setShowApproveDialog(true)}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Quote
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </section>
          )}

          {quote.status === "APPROVED" && quote.receiptUrl && (
            <Button
              className="w-full"
              onClick={() => setShowConfirmPaymentDialog(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          )}

          {quote.status === "APPROVED" && !quote.receiptUrl && (
            <p className="text-sm text-muted-foreground text-center">
              Waiting for client to upload payment receipt...
            </p>
          )}
        </section>
      </CardContent>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Quote</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a quote confirmation document with bank details to
              the client via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="py-4">
            <label className="text-sm font-medium">Total Price (USD)</label>
            <section className="flex items-center mt-2">
              <span className="text-lg mr-2">$</span>
              <input
                type="number"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter price"
              />
            </section>
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={approving}>
              {approving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve & Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Quote</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a rejection message to the client via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="py-4 space-y-4">
            <section>
              <label className="text-sm font-medium">Rejection Reason</label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
            <section>
              <label className="text-sm font-medium">
                Additional Note (Optional)
              </label>
              <Textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Add any additional details..."
                className="mt-2"
              />
            </section>
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Payment Dialog */}
      <AlertDialog
        open={showConfirmPaymentDialog}
        onOpenChange={setShowConfirmPaymentDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Have you verified the payment receipt? This will send the flight
              confirmation document to the client via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
            >
              {confirmingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Confirm & Send Flight Doc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
