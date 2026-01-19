"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Badge,
} from "@pexjet/ui";
import {
  Save,
  X,
  Loader2,
  Users,
  MapPin,
  Building,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { Calendar } from "@pexjet/ui";

interface EmptyLeg {
  id: string;
  slug: string;
  aircraftId: string | null;
  departureAirportId: string | null;
  arrivalAirportId: string | null;
  departureDateTime: string;
  totalSeats: number;
  priceType: "FIXED" | "CONTACT";
  priceUsd: number | null;
  availableSeats: number;
  status: string;
  source: string;
  departureAirport?: {
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
  };
  arrivalAirport?: {
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
  };
  aircraftCategory?: string;
  aircraftImage?: string | null;
  aircraftName?: string | null;
  aircraftType?: string | null;
  operatorName?: string | null;
  operatorEmail?: string | null;
  operatorPhone?: string | null;
  operatorCompanyId?: number | null;
  operatorWebsite?: string | null;
  operatorRating?: number | null;
  _count?: {
    bookings: number;
  };
}

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  maxPax: number | null;
}

interface Airport {
  id: string;
  name: string;
  municipality: string | null;
  iataCode: string | null;
  icaoCode: string | null;
}

interface EmptyLegBooking {
  id: string;
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  seatsRequested: number;
  status: string;
  totalPriceUsd: number;
  createdAt: string;
  client?: {
    fullName: string;
    email: string;
    phone: string;
  };
  payment?: {
    status: string;
    amountUsd: number;
    paidAt: string | null;
  };
}

interface EmptyLegFormProps {
  emptyLeg?: EmptyLeg;
  onSave: (data: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function EmptyLegForm({
  emptyLeg,
  onSave,
  onCancel,
  isEditing,
}: EmptyLegFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [bookings, setBookings] = useState<EmptyLegBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    aircraftId: emptyLeg?.aircraftId || "",
    departureTime: "",
    totalSeats: emptyLeg?.totalSeats?.toString() || "",
    priceType: (emptyLeg?.priceType || "FIXED") as "FIXED" | "CONTACT",
    priceUsd: emptyLeg?.priceUsd?.toString() || "",
  });

  // Check if this is an InstaCharter deal (read-only)
  const isInstaCharterDeal = emptyLeg?.source === "INSTACHARTER";

  useEffect(() => {
    // Fetch aircraft and bookings
    const fetchData = async () => {
      try {
        const [aircraftRes, bookingsRes] = await Promise.all([
          fetch("/api/aircraft", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }),
          emptyLeg?.id
            ? fetch(`/api/empty-legs/${emptyLeg.id}/bookings`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
              })
            : Promise.resolve({ ok: false }),
        ]);

        if (aircraftRes.ok) {
          const aircraftData = await aircraftRes.json();
          setAircraft(aircraftData.aircraft || []);
        }

        if (bookingsRes?.ok && "json" in bookingsRes) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();

    // Set date if editing
    if (emptyLeg?.departureDateTime) {
      const depDateTime = new Date(emptyLeg.departureDateTime);
      setSelectedDate(depDateTime);

      // Get local time string in HH:MM format
      const localHours = depDateTime.getHours().toString().padStart(2, "0");
      const localMinutes = depDateTime.getMinutes().toString().padStart(2, "0");
      const timeStr = `${localHours}:${localMinutes}`;

      setFormData((prev) => ({
        ...prev,
        departureTime: timeStr,
      }));
    }
  }, [emptyLeg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission for InstaCharter deals
    if (isInstaCharterDeal) {
      toast({
        title: "Read-Only Deal",
        description: "InstaCharter deals cannot be edited",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.aircraftId) {
      toast({
        title: "Validation Error",
        description: "Please select aircraft",
        variant: "destructive",
      });
      return;
    }

    if (!formData.departureTime) {
      toast({
        title: "Validation Error",
        description: "Please select departure time",
        variant: "destructive",
      });
      return;
    }

    if (!formData.totalSeats || parseInt(formData.totalSeats) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid total seats",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.priceType === "FIXED" &&
      (!formData.priceUsd || parseFloat(formData.priceUsd) <= 0)
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Keep the same date, only update time
      const originalDate = new Date(emptyLeg!.departureDateTime);
      const [hours, minutes] = formData.departureTime.split(":");

      // Create new date with the same date components but new time
      const updatedDate = new Date(
        originalDate.getFullYear(),
        originalDate.getMonth(),
        originalDate.getDate(),
        parseInt(hours),
        parseInt(minutes),
        0,
        0,
      );

      const data = {
        aircraftId: formData.aircraftId,
        departureDateTime: updatedDate.toISOString(),
        totalSeats: parseInt(formData.totalSeats),
        priceType: formData.priceType,
        priceUsd:
          formData.priceType === "FIXED" ? parseFloat(formData.priceUsd) : null,
      };

      await onSave(data);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">
            {isEditing
              ? isInstaCharterDeal
                ? "View InstaCharter Deal"
                : "Edit Empty Leg"
              : "Create Empty Leg"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? isInstaCharterDeal
                ? "InstaCharter deals are synchronized and cannot be edited"
                : "Update empty leg details"
              : "Fill in the details to create a new empty leg"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* InstaCharter Warning */}
        {isEditing && isInstaCharterDeal && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="font-medium text-amber-800">
                  InstaCharter Synchronized Deal
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  This deal is automatically synchronized from InstaCharter and
                  cannot be edited. Any changes will be overwritten during the
                  next sync.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Slug - Read Only */}
          {isEditing && emptyLeg?.slug && (
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={emptyLeg.slug}
                readOnly
                className="bg-muted"
                title="Auto-generated slug, cannot be changed"
              />
            </div>
          )}

          {/* Route Information - Read Only */}
          {isEditing && emptyLeg && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Route Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-medium">
                      {emptyLeg.departureAirport?.iataCode ||
                        emptyLeg.departureAirport?.icaoCode ||
                        "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emptyLeg.departureAirport?.municipality ||
                        emptyLeg.departureAirport?.name ||
                        "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="font-medium">
                      {emptyLeg.arrivalAirport?.iataCode ||
                        emptyLeg.arrivalAirport?.icaoCode ||
                        "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emptyLeg.arrivalAirport?.municipality ||
                        emptyLeg.arrivalAirport?.name ||
                        "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aircraft Selection - Editable */}
          <div className="space-y-2">
            <Label htmlFor="aircraftId">Aircraft *</Label>
            <Select
              value={formData.aircraftId}
              onValueChange={(value) =>
                !isInstaCharterDeal &&
                setFormData({ ...formData, aircraftId: value })
              }
              disabled={isInstaCharterDeal}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select aircraft" />
              </SelectTrigger>
              <SelectContent>
                {aircraft.map((ac) => (
                  <SelectItem key={ac.id} value={ac.id}>
                    {ac.name} ({ac.manufacturer})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isInstaCharterDeal && (
              <p className="text-xs text-muted-foreground">
                Aircraft information from InstaCharter
              </p>
            )}
          </div>

          {/* Departure Date and Time - Date is Read Only, Time is Dropdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input
                type="date"
                value={selectedDate?.toISOString().split("T")[0] || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureTime">Departure Time *</Label>
              <Select
                value={formData.departureTime}
                onValueChange={(value) =>
                  !isInstaCharterDeal &&
                  setFormData({ ...formData, departureTime: value })
                }
                disabled={isInstaCharterDeal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 96 }, (_, i) => {
                    const hours = Math.floor(i / 4);
                    const minutes = (i % 4) * 15;
                    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                    return (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {isInstaCharterDeal && (
                <p className="text-xs text-muted-foreground">
                  Time from InstaCharter
                </p>
              )}
            </div>
          </div>

          {/* Total Seats - Editable */}
          <div className="space-y-2">
            <Label htmlFor="totalSeats">Total Seats *</Label>
            <Input
              id="totalSeats"
              type="number"
              min="1"
              value={formData.totalSeats}
              onChange={(e) =>
                !isInstaCharterDeal &&
                setFormData({ ...formData, totalSeats: e.target.value })
              }
              placeholder="Number of seats available"
              disabled={isInstaCharterDeal}
            />
            {isInstaCharterDeal && (
              <p className="text-xs text-muted-foreground">
                Seat count from InstaCharter
              </p>
            )}
          </div>

          {/* Pricing - Editable */}
          <div className="space-y-2">
            <Label htmlFor="priceType">Price Type *</Label>
            <Select
              value={formData.priceType}
              onValueChange={(value: "FIXED" | "CONTACT") =>
                !isInstaCharterDeal &&
                setFormData({ ...formData, priceType: value })
              }
              disabled={isInstaCharterDeal}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed Price</SelectItem>
                <SelectItem value="CONTACT">Contact for Price</SelectItem>
              </SelectContent>
            </Select>
            {isInstaCharterDeal && (
              <p className="text-xs text-muted-foreground">
                Pricing from InstaCharter
              </p>
            )}
          </div>

          {formData.priceType === "FIXED" && (
            <div className="space-y-2">
              <Label htmlFor="priceUsd">Price (USD) *</Label>
              <Input
                id="priceUsd"
                type="number"
                min="0"
                step="0.01"
                value={formData.priceUsd}
                onChange={(e) =>
                  !isInstaCharterDeal &&
                  setFormData({ ...formData, priceUsd: e.target.value })
                }
                placeholder="Price per seat"
                disabled={isInstaCharterDeal}
              />
              {isInstaCharterDeal && (
                <p className="text-xs text-muted-foreground">
                  Price from InstaCharter
                </p>
              )}
            </div>
          )}

          {/* Operator Information Section - For InstaCharter Deals */}
          {isEditing && isInstaCharterDeal && emptyLeg && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Operator Information
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {emptyLeg.operatorName}
                        </p>
                        {emptyLeg.operatorCompanyId && (
                          <p className="text-xs text-muted-foreground">
                            ID: {emptyLeg.operatorCompanyId}
                          </p>
                        )}
                      </div>
                    </div>
                    {emptyLeg.operatorEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{emptyLeg.operatorEmail}</p>
                      </div>
                    )}
                    {emptyLeg.operatorPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{emptyLeg.operatorPhone}</p>
                      </div>
                    )}
                    {emptyLeg.operatorWebsite && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={emptyLeg.operatorWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                  {emptyLeg.operatorRating && (
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {emptyLeg.operatorRating}/5.0
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Aircraft Image - For InstaCharter Deals */}
          {isEditing && isInstaCharterDeal && emptyLeg?.aircraftImage && (
            <div className="space-y-2">
              <Label>Aircraft Image</Label>
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={emptyLeg.aircraftImage}
                  alt={emptyLeg.aircraftType || "Aircraft"}
                  className="w-full h-48 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Client Requests Section */}
          {isEditing && bookings.length > 0 && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Client Requests ({bookings.length})
                </h3>
              </div>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 bg-background rounded-md border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {booking.client?.fullName || booking.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.client?.email || booking.clientEmail} |{" "}
                          {booking.client?.phone || booking.clientPhone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Seats: {booking.seatsRequested} | Total: $
                          {booking.totalPriceUsd}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {booking.referenceNumber}
                        </p>
                        {booking.payment && (
                          <p className="text-xs text-muted-foreground">
                            Payment: {booking.payment.status} | Amount: $
                            {booking.payment.amountUsd}
                            {booking.payment.paidAt && (
                              <>
                                {" "}
                                | Paid:{" "}
                                {new Date(
                                  booking.payment.paidAt,
                                ).toLocaleDateString()}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={getBookingStatusColor(booking.status) as any}
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {!isInstaCharterDeal && (
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              {isInstaCharterDeal ? "Close" : "Cancel"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const getBookingStatusColor = (status: string) => {
    switch (status) {
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
}
