"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Plus,
  Plane,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Loader2,
  Eye,
  Edit,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useToast,
} from "@pexjet/ui";

interface EmptyLeg {
  id: string;
  slug: string;
  departureAirport: {
    name: string;
    municipality: string;
    iataCode: string;
  };
  arrivalAirport: {
    name: string;
    municipality: string;
    iataCode: string;
  };
  aircraft: {
    name: string;
    model: string;
  };
  departureDateTime: string;
  availableSeats: number;
  totalSeats: number;
  originalPriceNgn: number;
  discountPriceNgn: number;
  status: string;
  _count?: {
    bookings: number;
  };
}

interface Booking {
  id: string;
  referenceNumber: string;
  clientName: string;
  clientPhone: string;
  seatsRequested: number;
  totalPriceNgn: number;
  status: string;
  createdAt: string;
  emptyLeg: {
    departureAirport: { iataCode: string };
    arrivalAirport: { iataCode: string };
    departureDateTime: string;
  };
}

function EmptyLegsContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "deals",
  );
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBooking, setProcessingBooking] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (activeTab === "deals") {
      fetchEmptyLegs();
    } else {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchEmptyLegs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/empty-legs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmptyLegs(data.emptyLegs);
      }
    } catch (error) {
      console.error("Failed to fetch empty legs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    action: "approve" | "reject",
    reason?: string,
  ) => {
    setProcessingBooking(bookingId);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} booking`);
      }

      toast({
        title: action === "approve" ? "Booking Approved" : "Booking Rejected",
        description:
          action === "approve"
            ? "Client has been notified with payment details"
            : "Client has been notified of the rejection",
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingBooking(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "outline" | "destructive"> = {
      PUBLISHED: "default",
      OPEN: "default",
      CLOSED: "destructive",
      PENDING: "outline",
      APPROVED: "default",
      REJECTED: "destructive",
      PAID: "default",
    };
    return variants[status] || "outline";
  };

  // Format date/time as local time (LT) - uses UTC methods since we store local time as UTC
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empty Legs</h1>
          <p className="text-muted-foreground">
            Manage your empty leg deals and booking requests
          </p>
        </div>

        <Link href="/dashboard/empty-legs/new">
          <Button className="bg-gold-500 text-black hover:bg-gold-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Deal
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deals">My Deals</TabsTrigger>
          <TabsTrigger value="quotes" className="relative">
            Quote Requests
            {pendingBookings.length > 0 && (
              <Badge className="ml-2 bg-gold-500 text-black">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            </div>
          ) : emptyLegs.length > 0 ? (
            <div className="space-y-4">
              {emptyLegs.map((deal) => (
                <Card key={deal.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getStatusBadge(deal.status)}>
                            {deal.status}
                          </Badge>
                          {deal._count && deal._count.bookings > 0 && (
                            <Badge variant="outline">
                              {deal._count.bookings} booking(s)
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <span>
                            {deal.departureAirport.iataCode ||
                              deal.departureAirport.municipality}
                          </span>
                          <Plane className="h-4 w-4 text-gold-500" />
                          <span>
                            {deal.arrivalAirport.iataCode ||
                              deal.arrivalAirport.municipality}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(deal.departureDateTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {deal.availableSeats}/{deal.totalSeats} seats
                          </span>
                          <span className="flex items-center gap-1">
                            <Plane className="h-4 w-4" />
                            {deal.aircraft.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground line-through">
                            ₦{deal.originalPriceNgn.toLocaleString()}
                          </p>
                          <p className="text-lg font-bold text-gold-500">
                            ₦{deal.discountPriceNgn.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            per seat
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/empty-legs/${deal.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/empty-legs/${deal.id}/edit`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Deal
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Empty Leg Deals
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first empty leg deal to start receiving bookings
                </p>
                <Link href="/dashboard/empty-legs/new">
                  <Button className="bg-gold-500 text-black hover:bg-gold-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Deal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {booking.referenceNumber}
                          </span>
                        </div>

                        <p className="font-semibold">{booking.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.clientPhone}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Plane className="h-4 w-4" />
                            {booking.emptyLeg.departureAirport.iataCode} →{" "}
                            {booking.emptyLeg.arrivalAirport.iataCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(booking.emptyLeg.departureDateTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {booking.seatsRequested} seat(s)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ₦{booking.totalPriceNgn.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(booking.createdAt)}
                          </p>
                        </div>

                        {booking.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleBookingAction(booking.id, "approve")
                              }
                              disabled={processingBooking === booking.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingBooking === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleBookingAction(
                                  booking.id,
                                  "reject",
                                  "DEAL_NOT_AVAILABLE",
                                )
                              }
                              disabled={processingBooking === booking.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Booking Requests
                </h3>
                <p className="text-muted-foreground text-center">
                  When clients request bookings for your deals, they will appear
                  here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EmptyLegsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <EmptyLegsContent />
    </Suspense>
  );
}
