"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Plane,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Mail,
  Phone,
  Globe,
  ExternalLink,
} from "lucide-react";
import { formatUSD, formatDuration } from "@/lib/format-currency";

interface EmptyLeg {
  id: string;
  slug: string;
  status: string;
  source: "ADMIN" | "OPERATOR" | "INSTACHARTER";
  priceType: "FIXED" | "CONTACT";
  priceUsd: number | null;
  originalPriceUsd: number | null;
  totalSeats: number;
  availableSeats: number;
  departureDateTime: string;
  estimatedArrival: string | null;
  estimatedDurationMin: number | null;
  departureIcao: string | null;
  departureCity: string | null;
  arrivalIcao: string | null;
  arrivalCity: string | null;
  aircraftName: string | null;
  aircraftType: string | null;
  aircraftImage: string | null;
  operatorName: string | null;
  operatorEmail: string | null;
  operatorPhone: string | null;
  operatorWebsite: string | null;
  aircraft: {
    id: string;
    name: string;
    manufacturer: string;
    category: string;
    maxPax: number | null;
    image: string | null;
  } | null;
  departureAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
  } | null;
  arrivalAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
  } | null;
  createdByAdmin: { id: string; fullName: string } | null;
  createdByOperator: { id: string; fullName: string } | null;
  _count: { bookings: number };
}

export default function EmptyLegDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [emptyLeg, setEmptyLeg] = useState<EmptyLeg | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchEmptyLeg();
  }, [params.id]);

  const fetchEmptyLeg = async () => {
    try {
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
          description: "Empty leg not found",
          variant: "destructive",
        });
        router.push("/dashboard/empty-legs");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch empty leg",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!emptyLeg) return;
    try {
      setDeleting(true);
      const response = await fetch(`/api/empty-legs/${emptyLeg.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Empty leg deleted successfully",
        });
        router.push("/dashboard/empty-legs");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete empty leg",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
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
      case "UNAVAILABLE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "ADMIN":
        return "default";
      case "OPERATOR":
        return "secondary";
      case "INSTACHARTER":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (dateString: string) => {
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
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} LT`;
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </section>
    );
  }

  if (!emptyLeg) {
    return (
      <section className="flex items-center justify-center min-h-[400px]">
        <p>Empty leg not found</p>
      </section>
    );
  }

  const isInstaCharter = emptyLeg.source === "INSTACHARTER";
  const depCode =
    emptyLeg.departureAirport?.iataCode ||
    emptyLeg.departureAirport?.icaoCode ||
    emptyLeg.departureIcao ||
    "N/A";
  const arrCode =
    emptyLeg.arrivalAirport?.iataCode ||
    emptyLeg.arrivalAirport?.icaoCode ||
    emptyLeg.arrivalIcao ||
    "N/A";
  const depCity =
    emptyLeg.departureAirport?.municipality ||
    emptyLeg.departureAirport?.name ||
    emptyLeg.departureCity ||
    "";
  const arrCity =
    emptyLeg.arrivalAirport?.municipality ||
    emptyLeg.arrivalAirport?.name ||
    emptyLeg.arrivalCity ||
    "";
  const aircraftName =
    emptyLeg.aircraft?.name || emptyLeg.aircraftName || "N/A";

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <section className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/empty-legs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <article>
            <h1 className="text-3xl font-bold tracking-tight">
              {depCode} → {arrCode}
            </h1>
            <p className="text-muted-foreground">
              {depCity} to {arrCity}
            </p>
          </article>
        </section>
        <section className="flex items-center gap-2">
          <Badge variant={getSourceColor(emptyLeg.source) as any}>
            {emptyLeg.source}
          </Badge>
          <Badge variant={getStatusColor(emptyLeg.status) as any}>
            {emptyLeg.status}
          </Badge>
        </section>
      </header>

      {/* Content */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-[#D4AF37]" />
              Route & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route Visualization */}
            <section className="flex items-center gap-3">
              <section className="text-center">
                <p className="text-2xl font-bold">{depCode}</p>
                <p className="text-sm text-muted-foreground">{depCity}</p>
              </section>
              <section className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
              <section className="text-center">
                <p className="text-2xl font-bold">{arrCode}</p>
                <p className="text-sm text-muted-foreground">{arrCity}</p>
              </section>
            </section>

            {/* Schedule Details */}
            <section className="space-y-3">
              <article className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <section>
                  <p className="text-xs text-muted-foreground">Departure</p>
                  <p className="font-medium">
                    {formatDateTime(emptyLeg.departureDateTime)}
                  </p>
                </section>
              </article>
              {emptyLeg.estimatedArrival && (
                <article className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <section>
                    <p className="text-xs text-muted-foreground">
                      Estimated Arrival
                    </p>
                    <p className="font-medium">
                      {formatDateTime(emptyLeg.estimatedArrival)}
                    </p>
                  </section>
                </article>
              )}
              {emptyLeg.estimatedDurationMin && (
                <article className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <section>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {formatDuration(emptyLeg.estimatedDurationMin)}
                    </p>
                  </section>
                </article>
              )}
            </section>
          </CardContent>
        </Card>

        {/* Aircraft & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#D4AF37]" />
              Aircraft & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aircraft Image */}
            {(emptyLeg.aircraft?.image || emptyLeg.aircraftImage) && (
              <section className="border overflow-hidden bg-muted/30">
                <img
                  src={emptyLeg.aircraft?.image || emptyLeg.aircraftImage || ""}
                  alt={aircraftName}
                  className="w-full h-40 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </section>
            )}

            {/* Aircraft Details */}
            <section className="space-y-2">
              <p className="font-semibold text-lg">{aircraftName}</p>
              {emptyLeg.aircraft && (
                <p className="text-sm text-muted-foreground">
                  {emptyLeg.aircraft.manufacturer} -{" "}
                  {emptyLeg.aircraft.category.replace(/_/g, " ")}
                </p>
              )}
            </section>

            {/* Seats */}
            <article className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <section>
                <p className="text-xs text-muted-foreground">Seats</p>
                <p className="font-medium">
                  {emptyLeg.availableSeats} / {emptyLeg.totalSeats} available
                </p>
              </section>
            </article>

            {/* Pricing */}
            <section className="space-y-2 pt-4 border-t">
              {emptyLeg.priceType === "FIXED" && emptyLeg.priceUsd ? (
                <article>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    {formatUSD(emptyLeg.priceUsd)}
                  </p>
                  {emptyLeg.originalPriceUsd &&
                    emptyLeg.originalPriceUsd > emptyLeg.priceUsd && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatUSD(emptyLeg.originalPriceUsd)}
                      </p>
                    )}
                </article>
              ) : (
                <article>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-medium">Contact for Price</p>
                </article>
              )}
            </section>
          </CardContent>
        </Card>

        {/* Operator Info - InstaCharter only */}
        {isInstaCharter && emptyLeg.operatorName && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#D4AF37]" />
                Operator Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">{emptyLeg.operatorName}</p>
              {emptyLeg.operatorEmail && (
                <article className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{emptyLeg.operatorEmail}</p>
                </article>
              )}
              {emptyLeg.operatorPhone && (
                <article className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{emptyLeg.operatorPhone}</p>
                </article>
              )}
              {emptyLeg.operatorWebsite && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={emptyLeg.operatorWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage this empty leg</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="gold"
              className="w-full"
              asChild
              disabled={isInstaCharter}
            >
              <Link href={`/dashboard/empty-legs/${emptyLeg.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Empty Leg
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/empty-legs/${emptyLeg.id}/bookings`}>
                <Users className="h-4 w-4 mr-2" />
                View Bookings ({emptyLeg._count?.bookings || 0})
              </Link>
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isInstaCharter}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Empty Leg
            </Button>
            {isInstaCharter && (
              <p className="text-xs text-muted-foreground text-center">
                InstaCharter deals cannot be edited or deleted
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Empty Leg</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this empty leg? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  );
}
