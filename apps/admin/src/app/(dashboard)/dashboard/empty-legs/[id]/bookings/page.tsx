"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Label,
  useToast,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Check,
  X,
  Eye,
  Loader2,
  RefreshCw,
  Users,
  Phone,
  Mail,
} from "lucide-react";
import { formatUSD, formatDateTime } from "@/lib/format-currency";

interface Booking {
  id: string;
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  seatsRequested: number;
  totalPriceUsd: number;
  status: string;
  rejectionReason: string | null;
  rejectionNote: string | null;
  paymentDeadline: string | null;
  paymentLink: string | null;
  createdAt: string;
  client: {
    id: string;
    fullName: string | null;
    phone: string;
    email: string | null;
  };
  approvedBy: { id: string; fullName: string } | null;
  payment: {
    id: string;
    status: string;
    amountUsd: number;
    paidAt: string | null;
  } | null;
}

const REJECTION_REASONS = [
  { value: "SEATS_UNAVAILABLE", label: "Seats no longer available" },
  { value: "FLIGHT_CANCELLED", label: "Flight has been cancelled" },
  { value: "PRICING_CHANGED", label: "Pricing has changed" },
  { value: "SCHEDULE_CHANGED", label: "Schedule has changed" },
  { value: "CLIENT_UNVERIFIED", label: "Client verification failed" },
  { value: "OTHER", label: "Other reason" },
];

export default function EmptyLegBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchBookings();
    }
  }, [params.id]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/empty-legs/${params.id}/bookings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const response = await fetch(
        `/api/empty-legs/bookings/${bookingId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Booking approved successfully. Payment link generated.",
        });
        fetchBookings();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to approve booking",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionReason) return;

    setActionLoading(selectedBooking.id);
    try {
      const response = await fetch(
        `/api/empty-legs/bookings/${selectedBooking.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            reason: rejectionReason,
            note: rejectionNote,
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Booking rejected. Client will be notified.",
        });
        setRejectDialogOpen(false);
        setSelectedBooking(null);
        setRejectionReason("");
        setRejectionNote("");
        fetchBookings();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to reject booking",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
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
      case "EXPIRED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const openRejectDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectDialogOpen(true);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <section className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/empty-legs/${params.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <article>
            <h1 className="text-3xl font-bold">Booking Requests</h1>
            <p className="text-muted-foreground">
              Manage quote requests for this empty leg
            </p>
          </article>
        </section>
        <Button variant="outline" onClick={fetchBookings} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#D4AF37]" />
            Bookings ({bookings.length})
          </CardTitle>
          <CardDescription>Review and manage booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <section className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </section>
          ) : bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono font-medium">
                      {booking.referenceNumber}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{booking.clientName}</p>
                      <section className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {booking.clientPhone}
                      </section>
                      {booking.clientEmail && (
                        <section className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {booking.clientEmail}
                        </section>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.seatsRequested}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-[#D4AF37]">
                        {formatUSD(booking.totalPriceUsd)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(booking.status) as any}>
                        {booking.status}
                      </Badge>
                      {booking.status === "APPROVED" &&
                        booking.paymentDeadline && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pay by: {formatDateTime(booking.paymentDeadline)}
                          </p>
                        )}
                      {booking.status === "REJECTED" &&
                        booking.rejectionReason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {REJECTION_REASONS.find(
                              (r) => r.value === booking.rejectionReason,
                            )?.label || booking.rejectionReason}
                          </p>
                        )}
                    </TableCell>
                    <TableCell>{formatDateTime(booking.createdAt)}</TableCell>
                    <TableCell>
                      <section className="flex items-center gap-2">
                        {booking.status === "PENDING" && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="gold"
                                  disabled={actionLoading === booking.id}
                                >
                                  {actionLoading === booking.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Approve Booking
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will approve the booking for{" "}
                                    {booking.clientName} and generate a payment
                                    link. The client will have 3 hours to
                                    complete payment.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApprove(booking.id)}
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(booking)}
                              disabled={actionLoading === booking.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {booking.status === "APPROVED" &&
                          booking.paymentLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  booking.paymentLink!,
                                );
                                toast({
                                  title: "Copied",
                                  description:
                                    "Payment link copied to clipboard",
                                });
                              }}
                            >
                              Copy Link
                            </Button>
                          )}

                        <Button size="sm" variant="ghost" asChild>
                          <Link
                            href={`/dashboard/empty-legs/bookings/${booking.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </section>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <section className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground">
                Booking requests will appear here when clients request quotes
              </p>
            </section>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Please select a reason for rejecting this booking. The client will
              be notified via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <section className="space-y-4 py-4">
            <article className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
                <SelectTrigger>
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
            </article>

            <article className="space-y-2">
              <Label>Additional Note (Optional)</Label>
              <Textarea
                placeholder="Add any additional information for the client..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={3}
              />
            </article>
          </section>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedBooking(null);
                setRejectionReason("");
                setRejectionNote("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={
                !rejectionReason || actionLoading === selectedBooking?.id
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === selectedBooking?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
