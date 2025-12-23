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
  Separator,
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
  useToast,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Plane,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Pencil,
  Trash2,
  ExternalLink,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import {
  formatUSD,
  formatDuration,
  formatTime,
  formatDate,
} from "@/lib/format-currency";

interface EmptyLegDetail {
  id: string;
  slug: string;
  status: string;
  originalPriceUsd: number;
  discountPriceUsd: number;
  totalSeats: number;
  availableSeats: number;
  departureDateTime: string;
  estimatedArrival: string;
  estimatedDurationMin: number;
  createdAt: string;
  updatedAt: string;
  aircraft: {
    id: string;
    name: string;
    model: string;
    manufacturer: string;
    category: string;
    passengerCapacityMax: number;
    passengerCapacityMin: number;
    rangeNm: number;
    cruiseSpeedKnots: number;
    thumbnailImage: string | null;
    exteriorImages: string[];
    interiorImages: string[];
  };
  departureAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
    latitude: number;
    longitude: number;
  };
  arrivalAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
    latitude: number;
    longitude: number;
  };
  createdByAdmin: { id: string; fullName: string; email: string } | null;
  createdByOperator: { id: string; fullName: string; email: string } | null;
  bookings: Array<{
    id: string;
    referenceNumber: string;
    status: string;
    seatsRequested: number;
    totalPriceUsd: number;
    createdAt: string;
    client: {
      id: string;
      fullName: string | null;
      phone: string;
      email: string | null;
    };
  }>;
}

export default function EmptyLegDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [emptyLeg, setEmptyLeg] = useState<EmptyLegDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEmptyLeg();
    }
  }, [params.id]);

  const fetchEmptyLeg = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/empty-legs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmptyLeg(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load empty leg details",
          variant: "destructive",
        });
        router.push("/dashboard/empty-legs");
      }
    } catch (error) {
      console.error("Failed to fetch empty leg:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/empty-legs/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Empty leg deleted successfully",
        });
        router.push("/dashboard/empty-legs");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete empty leg",
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
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "success";
      case "OPEN":
        return "warning";
      case "CLOSED":
        return "secondary";
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "PAID":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (!emptyLeg) {
    return (
      <section className="text-center py-12">
        <p className="text-muted-foreground">Empty leg not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/empty-legs">Back to Empty Legs</Link>
        </Button>
      </section>
    );
  }

  const discount = Math.round(
    ((emptyLeg.originalPriceUsd - emptyLeg.discountPriceUsd) /
      emptyLeg.originalPriceUsd) *
      100,
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <section className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/empty-legs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <article>
            <section className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {emptyLeg.departureAirport.iataCode ||
                  emptyLeg.departureAirport.icaoCode}{" "}
                →{" "}
                {emptyLeg.arrivalAirport.iataCode ||
                  emptyLeg.arrivalAirport.icaoCode}
              </h1>
              <Badge variant={getStatusColor(emptyLeg.status) as any}>
                {emptyLeg.status}
              </Badge>
            </section>
            <p className="text-muted-foreground">
              {emptyLeg.departureAirport.municipality ||
                emptyLeg.departureAirport.name}{" "}
              →{" "}
              {emptyLeg.arrivalAirport.municipality ||
                emptyLeg.arrivalAirport.name}
            </p>
          </article>
        </section>
        <section className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/empty-legs/${emptyLeg.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={emptyLeg.bookings.length > 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Empty Leg</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this empty leg? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <section className="lg:col-span-2 space-y-6">
          {/* Flight Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-[#D4AF37]" />
                Flight Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <section className="grid gap-6 md:grid-cols-2">
                {/* Departure */}
                <article className="space-y-2">
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="text-2xl font-bold">
                    {emptyLeg.departureAirport.iataCode ||
                      emptyLeg.departureAirport.icaoCode}
                  </p>
                  <p className="font-medium">
                    {emptyLeg.departureAirport.municipality ||
                      emptyLeg.departureAirport.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {emptyLeg.departureAirport.name}
                  </p>
                  <Separator className="my-2" />
                  <section className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        emptyLeg.departureDateTime,
                      ).toLocaleDateString()}
                    </span>
                  </section>
                  <section className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(emptyLeg.departureDateTime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </section>
                </article>

                {/* Arrival */}
                <article className="space-y-2">
                  <p className="text-sm text-muted-foreground">Arrival</p>
                  <p className="text-2xl font-bold">
                    {emptyLeg.arrivalAirport.iataCode ||
                      emptyLeg.arrivalAirport.icaoCode}
                  </p>
                  <p className="font-medium">
                    {emptyLeg.arrivalAirport.municipality ||
                      emptyLeg.arrivalAirport.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {emptyLeg.arrivalAirport.name}
                  </p>
                  <Separator className="my-2" />
                  <section className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(emptyLeg.estimatedArrival).toLocaleDateString()}
                    </span>
                  </section>
                  <section className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(emptyLeg.estimatedArrival).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}{" "}
                      (est.)
                    </span>
                  </section>
                </article>
              </section>

              <Separator className="my-6" />

              <section className="flex items-center justify-center gap-8 text-center">
                <article>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-xl font-bold">
                    {formatDuration(emptyLeg.estimatedDurationMin)}
                  </p>
                </article>
                <article>
                  <p className="text-sm text-muted-foreground">
                    Available Seats
                  </p>
                  <p className="text-xl font-bold">
                    {emptyLeg.availableSeats} / {emptyLeg.totalSeats}
                  </p>
                </article>
              </section>
            </CardContent>
          </Card>

          {/* Aircraft */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-[#D4AF37]" />
                Aircraft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <section className="flex gap-6">
                {emptyLeg.aircraft.thumbnailImage && (
                  <img
                    src={emptyLeg.aircraft.thumbnailImage}
                    alt={emptyLeg.aircraft.name}
                    className="w-32 h-24 object-cover"
                  />
                )}
                <article className="flex-1 space-y-2">
                  <p className="text-xl font-bold">{emptyLeg.aircraft.name}</p>
                  <p className="text-muted-foreground">
                    {emptyLeg.aircraft.manufacturer} {emptyLeg.aircraft.model}
                  </p>
                  <section className="grid grid-cols-2 gap-2 text-sm">
                    <span>
                      Category: {emptyLeg.aircraft.category.replace(/_/g, " ")}
                    </span>
                    <span>
                      Capacity: {emptyLeg.aircraft.passengerCapacityMin}-
                      {emptyLeg.aircraft.passengerCapacityMax} passengers
                    </span>
                    <span>
                      Range: {emptyLeg.aircraft.rangeNm.toLocaleString()} nm
                    </span>
                    <span>
                      Cruise: {emptyLeg.aircraft.cruiseSpeedKnots} knots
                    </span>
                  </section>
                </article>
              </section>
            </CardContent>
          </Card>

          {/* Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <article>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#D4AF37]" />
                  Bookings ({emptyLeg.bookings.length})
                </CardTitle>
                <CardDescription>
                  Quote requests for this empty leg
                </CardDescription>
              </article>
              {emptyLeg.bookings.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/empty-legs/${emptyLeg.id}/bookings`}>
                    Manage Bookings
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {emptyLeg.bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emptyLeg.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono">
                          {booking.referenceNumber}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {booking.client.fullName || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.client.phone}
                          </p>
                        </TableCell>
                        <TableCell>{booking.seatsRequested}</TableCell>
                        <TableCell>
                          {formatUSD(booking.totalPriceUsd)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(booking.status) as any}
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No bookings yet
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sidebar */}
        <section className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <article className="text-center p-4 bg-[#D4AF37]/10">
                <p className="text-sm text-muted-foreground line-through">
                  {formatUSD(emptyLeg.originalPriceUsd)}
                </p>
                <p className="text-3xl font-bold text-[#D4AF37]">
                  {formatUSD(emptyLeg.discountPriceUsd)}
                </p>
                <p className="text-sm text-muted-foreground">per seat</p>
                <Badge variant="success" className="mt-2">
                  {discount}% OFF
                </Badge>
              </article>

              <Separator />

              <article className="space-y-2 text-sm">
                <section className="flex justify-between">
                  <span className="text-muted-foreground">Total Seats</span>
                  <span>{emptyLeg.totalSeats}</span>
                </section>
                <section className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span>{emptyLeg.availableSeats}</span>
                </section>
                <section className="flex justify-between">
                  <span className="text-muted-foreground">Booked</span>
                  <span>{emptyLeg.totalSeats - emptyLeg.availableSeats}</span>
                </section>
              </article>
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <article className="space-y-1">
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">
                  {emptyLeg.createdByAdmin?.fullName ||
                    emptyLeg.createdByOperator?.fullName ||
                    "System"}
                </p>
              </article>

              <article className="space-y-1">
                <p className="text-muted-foreground">Created At</p>
                <p>{new Date(emptyLeg.createdAt).toLocaleString()}</p>
              </article>

              <article className="space-y-1">
                <p className="text-muted-foreground">Last Updated</p>
                <p>{new Date(emptyLeg.updatedAt).toLocaleString()}</p>
              </article>

              <article className="space-y-1">
                <p className="text-muted-foreground">Slug</p>
                <p className="font-mono text-xs break-all">{emptyLeg.slug}</p>
              </article>
            </CardContent>
          </Card>
        </section>
      </section>
    </section>
  );
}
