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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Separator,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Plane,
  Loader2,
  Save,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
} from "lucide-react";

const statusOptions = [
  { value: "PUBLISHED", label: "Published" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

const priceTypeOptions = [
  { value: "FIXED", label: "Fixed Price" },
  { value: "CONTACT", label: "Contact for Price" },
];

interface EmptyLeg {
  id: string;
  slug: string;
  status: string;
  source: "ADMIN" | "OPERATOR" | "INSTACHARTER";
  priceType: "FIXED" | "CONTACT";
  priceUsd: number | null;
  totalSeats: number;
  availableSeats: number;
  departureDateTime: string;
  estimatedArrival: string | null;
  estimatedDurationMin: number | null;
  aircraftId: string | null;
  departureAirportId: string | null;
  arrivalAirportId: string | null;
  // Relations
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
}

export default function EditEmptyLegPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  const [emptyLeg, setEmptyLeg] = useState<EmptyLeg | null>(null);
  const [formData, setFormData] = useState({
    aircraftId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    departureDate: "",
    departureTime: "",
    totalSeats: "",
    availableSeats: "",
    priceType: "FIXED" as "FIXED" | "CONTACT",
    priceUsd: "",
    status: "PUBLISHED",
  });

  // Helper functions for computed values
  const selectedAircraft = aircraft.find((a) => a.id === formData.aircraftId);
  const selectedDeparture = airports.find(
    (a) => a.id === formData.departureAirportId,
  );
  const selectedArrival = airports.find(
    (a) => a.id === formData.arrivalAirportId,
  );

  const calculateDiscount = () => {
    // This is a placeholder - implement based on your business logic
    return 0;
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // Fetch empty leg details
      const emptyLegResponse = await fetch(`/api/empty-legs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (emptyLegResponse.ok) {
        const data = await emptyLegResponse.json();
        setEmptyLeg(data);

        // Parse departure datetime
        const depDateTime = new Date(data.departureDateTime);
        const dateStr = depDateTime.toISOString().split("T")[0];
        const timeStr = depDateTime.toTimeString().slice(0, 5);

        setFormData({
          aircraftId: data.aircraft?.id || "",
          departureAirportId: data.departureAirport?.id || "",
          arrivalAirportId: data.arrivalAirport?.id || "",
          departureDate: dateStr,
          departureTime: timeStr,
          totalSeats: data.totalSeats.toString(),
          availableSeats: data.availableSeats.toString(),
          priceType: data.priceType,
          priceUsd: data.priceUsd?.toString() || "",
          status: data.status,
        });
      } else {
        toast({
          title: "Error",
          description: "Empty leg not found",
          variant: "destructive",
        });
        router.push("/dashboard/empty-legs");
        return;
      }

      // Fetch aircraft options
      const aircraftResponse = await fetch("/api/aircraft", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (aircraftResponse.ok) {
        const aircraftData = await aircraftResponse.json();
        setAircraft(aircraftData.aircraft || []);
      }

      // Fetch airport options
      const airportsResponse = await fetch("/api/airports", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (airportsResponse.ok) {
        const airportsData = await airportsResponse.json();
        setAirports(airportsData.airports || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.aircraftId) {
        toast({
          title: "Validation Error",
          description: "Please select aircraft",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (!formData.departureAirportId || !formData.arrivalAirportId) {
        toast({
          title: "Validation Error",
          description: "Please select both airports",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (formData.departureAirportId === formData.arrivalAirportId) {
        toast({
          title: "Validation Error",
          description: "Departure and arrival airports must be different",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (!formData.totalSeats || parseInt(formData.totalSeats) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter valid total seats",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (
        formData.priceType === "FIXED" &&
        (!formData.priceUsd || parseFloat(formData.priceUsd) <= 0)
      ) {
        toast({
          title: "Validation Error",
          description: "Please enter valid price",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Combine date and time
      const dateTime = new Date(
        `${formData.departureDate}T${formData.departureTime}`,
      );

      const updateData = {
        aircraftId: formData.aircraftId,
        departureAirportId: formData.departureAirportId,
        arrivalAirportId: formData.arrivalAirportId,
        departureDateTime: dateTime.toISOString(),
        totalSeats: parseInt(formData.totalSeats),
        availableSeats: parseInt(formData.availableSeats),
        priceType: formData.priceType,
        priceUsd:
          formData.priceType === "FIXED" ? parseFloat(formData.priceUsd) : null,
        status: formData.status,
      };

      const response = await fetch(`/api/empty-legs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "Empty Leg Updated",
          description: "Changes saved successfully.",
        });
        router.push("/dashboard/empty-legs");
      } else {
        const error = await response.json();
        toast({
          title: "Save Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!emptyLeg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Empty leg not found</p>
      </div>
    );
  }

  // Check if this is an InstaCharter deal (read-only)
  const isInstaCharterDeal = emptyLeg.source === "INSTACHARTER";

  // Fields that should be editable after creation
  const isEditable = !isInstaCharterDeal;

  // Fields that should never be editable (only display)
  const isReadOnlyField = (fieldName: string) => {
    // These fields shouldn't be changeable after creation
    const nonEditableFields = [
      "departureAirportId",
      "arrivalAirportId",
      "aircraftId",
      "departureDate",
      "departureTime",
    ];
    return nonEditableFields.includes(fieldName);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/empty-legs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Empty Leg</h1>
          <p className="text-muted-foreground">
            Update empty leg details
            {isInstaCharterDeal && (
              <span className="ml-2 text-orange-600">
                (InstaCharter Deal - Read Only)
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Empty Leg Information</CardTitle>
          <CardDescription>
            Modify the details for this empty leg deal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status - Editable for admin-created deals */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </h3>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    isEditable && setFormData({ ...formData, status: value })
                  }
                  disabled={!isEditable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Route Information */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Route Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureAirport">Departure Airport</Label>
                  <Select
                    value={formData.departureAirportId}
                    onValueChange={(value) =>
                      isEditable &&
                      !isReadOnlyField("departureAirportId") &&
                      setFormData({ ...formData, departureAirportId: value })
                    }
                    disabled={
                      !isEditable || isReadOnlyField("departureAirportId")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select departure airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => (
                        <SelectItem key={airport.id} value={airport.id}>
                          {airport.name} ({airport.iataCode || airport.icaoCode}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalAirport">Arrival Airport</Label>
                  <Select
                    value={formData.arrivalAirportId}
                    onValueChange={(value) =>
                      isEditable &&
                      !isReadOnlyField("arrivalAirportId") &&
                      setFormData({ ...formData, arrivalAirportId: value })
                    }
                    disabled={
                      !isEditable || isReadOnlyField("arrivalAirportId")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select arrival airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => (
                        <SelectItem key={airport.id} value={airport.id}>
                          {airport.name} ({airport.iataCode || airport.icaoCode}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) =>
                      isEditable &&
                      !isReadOnlyField("departureDate") &&
                      setFormData({
                        ...formData,
                        departureDate: e.target.value,
                      })
                    }
                    disabled={!isEditable || isReadOnlyField("departureDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) =>
                      isEditable &&
                      !isReadOnlyField("departureTime") &&
                      setFormData({
                        ...formData,
                        departureTime: e.target.value,
                      })
                    }
                    disabled={!isEditable || isReadOnlyField("departureTime")}
                  />
                </div>
              </div>
            </div>

            {/* Aircraft Information */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Aircraft Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aircraft</Label>
                <Select
                  value={formData.aircraftId}
                  onValueChange={(value) =>
                    isEditable &&
                    !isReadOnlyField("aircraftId") &&
                    setFormData({ ...formData, aircraftId: value })
                  }
                  disabled={!isEditable || isReadOnlyField("aircraftId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraft.map((craft) => (
                      <SelectItem key={craft.id} value={craft.id}>
                        {craft.name} - {craft.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSeats">Total Seats</Label>
                  <Input
                    id="totalSeats"
                    type="number"
                    value={formData.totalSeats}
                    onChange={(e) =>
                      isEditable &&
                      setFormData({ ...formData, totalSeats: e.target.value })
                    }
                    disabled={!isEditable}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableSeats">Available Seats</Label>
                  <Input
                    id="availableSeats"
                    type="number"
                    value={formData.availableSeats}
                    onChange={(e) =>
                      isEditable &&
                      setFormData({
                        ...formData,
                        availableSeats: e.target.value,
                      })
                    }
                    disabled={!isEditable}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Pricing
              </h3>
              <div className="space-y-2">
                <Label htmlFor="priceType">Price Type</Label>
                <Select
                  value={formData.priceType}
                  onValueChange={(value) =>
                    isEditable &&
                    setFormData({
                      ...formData,
                      priceType: value as "FIXED" | "CONTACT",
                    })
                  }
                  disabled={!isEditable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select price type" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.priceType === "FIXED" && (
                <div className="space-y-2">
                  <Label htmlFor="priceUsd">Price per Seat (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="priceUsd"
                      type="number"
                      value={formData.priceUsd}
                      onChange={(e) =>
                        isEditable &&
                        setFormData({ ...formData, priceUsd: e.target.value })
                      }
                      disabled={!isEditable}
                      min="0"
                      step="0.01"
                      className="pl-8"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={saving || !isEditable}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
