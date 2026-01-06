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
  Calendar20,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Plane,
  MapPin,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Clock,
  Loader2,
  Search,
} from "lucide-react";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  maxPax: number | null;
  cruiseSpeedKnots: number | null;
  image: string | null;
}

interface Airport {
  id: string;
  name: string;
  municipality: string | null;
  iataCode: string | null;
  icaoCode: string | null;
  countryCode: string;
  regionCode: string;
  type: string;
  region?: {
    name: string;
  };
}

export default function NewEmptyLegPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [loadingAircraft, setLoadingAircraft] = useState(true);

  // Airport search states
  const [departureSearch, setDepartureSearch] = useState("");
  const [arrivalSearch, setArrivalSearch] = useState("");
  const [departureResults, setDepartureResults] = useState<Airport[]>([]);
  const [arrivalResults, setArrivalResults] = useState<Airport[]>([]);
  const [searchingDeparture, setSearchingDeparture] = useState(false);
  const [searchingArrival, setSearchingArrival] = useState(false);
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    aircraftId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    totalSeats: "",
    priceType: "FIXED" as "FIXED" | "CONTACT",
    priceUsd: "",
  });

  // Departure date/time state for Calendar20
  const [departureDate, setDepartureDate] = useState<{
    date?: string | null;
    time?: string | null;
  }>({ date: null, time: null });

  const [selectedDeparture, setSelectedDeparture] = useState<Airport | null>(
    null,
  );
  const [selectedArrival, setSelectedArrival] = useState<Airport | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(
    null,
  );

  // Fetch aircraft on mount
  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    try {
      const response = await fetch(
        "/api/aircraft?limit=100&availability=BOTH,LOCAL,INTERNATIONAL",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setAircraftList(data.aircraft || []);
      }
    } catch (error) {
      console.error("Failed to fetch aircraft:", error);
    } finally {
      setLoadingAircraft(false);
    }
  };

  // Search airports with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (departureSearch.length >= 2) {
        searchAirports(departureSearch, "departure");
      } else {
        setDepartureResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [departureSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arrivalSearch.length >= 2) {
        searchAirports(arrivalSearch, "arrival");
      } else {
        setArrivalResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [arrivalSearch]);

  const searchAirports = async (
    query: string,
    type: "departure" | "arrival",
  ) => {
    if (type === "departure") {
      setSearchingDeparture(true);
    } else {
      setSearchingArrival(true);
    }

    try {
      const response = await fetch(
        `/api/airports?search=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        if (type === "departure") {
          setDepartureResults(data.airports || []);
          setShowDepartureDropdown(true);
        } else {
          setArrivalResults(data.airports || []);
          setShowArrivalDropdown(true);
        }
      }
    } catch (error) {
      console.error("Failed to search airports:", error);
    } finally {
      if (type === "departure") {
        setSearchingDeparture(false);
      } else {
        setSearchingArrival(false);
      }
    }
  };

  const selectAirport = (airport: Airport, type: "departure" | "arrival") => {
    const displayText = `[${airport.iataCode || "N/A"}/${airport.icaoCode || "N/A"}] - ${airport.region?.name || airport.regionCode}`;
    if (type === "departure") {
      setSelectedDeparture(airport);
      setFormData((prev) => ({ ...prev, departureAirportId: airport.id }));
      setDepartureSearch(displayText);
      setShowDepartureDropdown(false);
    } else {
      setSelectedArrival(airport);
      setFormData((prev) => ({ ...prev, arrivalAirportId: airport.id }));
      setArrivalSearch(displayText);
      setShowArrivalDropdown(false);
    }
  };

  const handleAircraftChange = (aircraftId: string) => {
    const aircraft = aircraftList.find((a) => a.id === aircraftId);
    setSelectedAircraft(aircraft || null);
    setFormData((prev) => ({
      ...prev,
      aircraftId,
      totalSeats: aircraft?.maxPax?.toString() || "",
    }));
  };

  // Calculate discount is no longer needed since we don't have discount pricing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.aircraftId) {
      toast({
        title: "Error",
        description: "Please select an aircraft",
        variant: "destructive",
      });
      return;
    }
    if (!formData.departureAirportId) {
      toast({
        title: "Error",
        description: "Please select a departure airport",
        variant: "destructive",
      });
      return;
    }
    if (!formData.arrivalAirportId) {
      toast({
        title: "Error",
        description: "Please select an arrival airport",
        variant: "destructive",
      });
      return;
    }
    if (formData.departureAirportId === formData.arrivalAirportId) {
      toast({
        title: "Error",
        description: "Departure and arrival airports must be different",
        variant: "destructive",
      });
      return;
    }
    if (!departureDate.date || !departureDate.time) {
      toast({
        title: "Error",
        description: "Please select departure date and time",
        variant: "destructive",
      });
      return;
    }
    if (!formData.totalSeats || parseInt(formData.totalSeats) < 1) {
      toast({
        title: "Error",
        description: "Please enter valid number of seats",
        variant: "destructive",
      });
      return;
    }
    if (
      formData.priceType === "FIXED" &&
      (!formData.priceUsd || parseFloat(formData.priceUsd) <= 0)
    ) {
      toast({
        title: "Error",
        description: "Please enter valid price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO datetime string
      const departureDateTime = `${departureDate.date}T${departureDate.time}:00`;

      const response = await fetch("/api/empty-legs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          ...formData,
          departureDateTime,
          // Don't send priceUsd if priceType is CONTACT
          ...(formData.priceType === "FIXED" && {
            priceUsd: formData.priceUsd,
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Empty leg deal created successfully",
        });
        router.push("/dashboard/empty-legs");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create empty leg",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create empty leg:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/empty-legs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <article>
          <h1 className="text-3xl font-bold">Create Empty Leg Deal</h1>
          <p className="text-muted-foreground">
            Add a new discounted empty leg flight
          </p>
        </article>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <section className="lg:col-span-2 space-y-6">
            {/* Aircraft Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[#D4AF37]" />
                  Aircraft
                </CardTitle>
                <CardDescription>
                  Select the aircraft for this empty leg
                </CardDescription>
              </CardHeader>
              <CardContent>
                <section className="space-y-4">
                  <article className="space-y-2">
                    <Label htmlFor="aircraft">Aircraft *</Label>
                    <Select
                      value={formData.aircraftId}
                      onValueChange={handleAircraftChange}
                      disabled={loadingAircraft}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingAircraft
                              ? "Loading aircraft..."
                              : "Select aircraft"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {aircraftList.map((aircraft) => (
                          <SelectItem key={aircraft.id} value={aircraft.id}>
                            {aircraft.name} ({aircraft.manufacturer})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </article>

                  {selectedAircraft && (
                    <article className="p-4 bg-muted/50 space-y-2">
                      <p className="font-medium">{selectedAircraft.name}</p>
                      <section className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span>
                          Category:{" "}
                          {selectedAircraft.category.replace(/_/g, " ")}
                        </span>
                        <span>
                          Max Passengers: {selectedAircraft.maxPax || "N/A"}
                        </span>
                        <span>
                          Cruise Speed:{" "}
                          {selectedAircraft.cruiseSpeedKnots || "N/A"} knots
                        </span>
                      </section>
                    </article>
                  )}
                </section>
              </CardContent>
            </Card>

            {/* Route Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#D4AF37]" />
                  Route
                </CardTitle>
                <CardDescription>
                  Select departure and arrival airports (medium & large airports
                  only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <section className="grid gap-6 md:grid-cols-2">
                  {/* Departure Airport */}
                  <article className="space-y-2 relative">
                    <Label htmlFor="departure">Departure Airport *</Label>
                    <section className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="departure"
                        placeholder="Search by IATA, ICAO code, or region..."
                        value={departureSearch}
                        onChange={(e) => {
                          setDepartureSearch(e.target.value);
                          setSelectedDeparture(null);
                          setFormData((prev) => ({
                            ...prev,
                            departureAirportId: "",
                          }));
                        }}
                        onFocus={() =>
                          departureResults.length > 0 &&
                          setShowDepartureDropdown(true)
                        }
                        className="pl-10"
                      />
                      {searchingDeparture && (
                        <Loader2
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      )}
                    </section>
                    {showDepartureDropdown && departureResults.length > 0 && (
                      <section className="absolute z-50 w-full mt-1 bg-background border shadow-lg max-h-60 overflow-auto">
                        {departureResults.map((airport) => (
                          <button
                            key={airport.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted"
                            onClick={() => selectAirport(airport, "departure")}
                          >
                            <span className="font-medium">
                              [{airport.iataCode || "N/A"}/
                              {airport.icaoCode || "N/A"}] -{" "}
                              {airport.region?.name || airport.regionCode}
                            </span>
                          </button>
                        ))}
                      </section>
                    )}
                  </article>

                  {/* Arrival Airport */}
                  <article className="space-y-2 relative">
                    <Label htmlFor="arrival">Arrival Airport *</Label>
                    <section className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="arrival"
                        placeholder="Search by IATA, ICAO code, or region..."
                        value={arrivalSearch}
                        onChange={(e) => {
                          setArrivalSearch(e.target.value);
                          setSelectedArrival(null);
                          setFormData((prev) => ({
                            ...prev,
                            arrivalAirportId: "",
                          }));
                        }}
                        onFocus={() =>
                          arrivalResults.length > 0 &&
                          setShowArrivalDropdown(true)
                        }
                        className="pl-10"
                      />
                      {searchingArrival && (
                        <Loader2
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      )}
                    </section>
                    {showArrivalDropdown && arrivalResults.length > 0 && (
                      <section className="absolute z-50 w-full mt-1 bg-background border shadow-lg max-h-60 overflow-auto">
                        {arrivalResults.map((airport) => (
                          <button
                            key={airport.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted"
                            onClick={() => selectAirport(airport, "arrival")}
                          >
                            <span className="font-medium">
                              [{airport.iataCode || "N/A"}/
                              {airport.icaoCode || "N/A"}] -{" "}
                              {airport.region?.name || airport.regionCode}
                            </span>
                          </button>
                        ))}
                      </section>
                    )}
                  </article>
                </section>

                {/* Airport Filter Notice */}
                <article className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Search results include small, medium,
                    and large airports only. Heliports and other facilities are
                    excluded.
                  </p>
                </article>

                {/* Route Preview */}
                {selectedDeparture && selectedArrival && (
                  <article className="mt-4 p-4 bg-muted/50 flex items-center justify-center gap-4">
                    <section className="text-center">
                      <p className="text-2xl font-bold">
                        {selectedDeparture.iataCode ||
                          selectedDeparture.icaoCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDeparture.municipality ||
                          selectedDeparture.name}
                      </p>
                    </section>
                    <Plane className="h-6 w-6 text-[#D4AF37]" />
                    <section className="text-center">
                      <p className="text-2xl font-bold">
                        {selectedArrival.iataCode || selectedArrival.icaoCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedArrival.municipality || selectedArrival.name}
                      </p>
                    </section>
                  </article>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-[#D4AF37]" />
                  Schedule
                </CardTitle>
                <CardDescription>
                  Set departure date, time, and available seats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <section className="grid gap-6 md:grid-cols-2">
                  <article className="space-y-2">
                    <Label>Departure Date & Time *</Label>
                    <Calendar20
                      placeholder="Select departure date & time"
                      value={departureDate}
                      onChange={setDepartureDate}
                    />
                  </article>

                  <article className="space-y-2">
                    <Label htmlFor="totalSeats">Available Seats *</Label>
                    <section className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="totalSeats"
                        type="number"
                        placeholder="e.g., 8"
                        value={formData.totalSeats}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            totalSeats: e.target.value,
                          }))
                        }
                        min="1"
                        max={selectedAircraft?.maxPax || 20}
                        className="pl-10"
                      />
                    </section>
                    {selectedAircraft && (
                      <p className="text-xs text-muted-foreground">
                        Max capacity: {selectedAircraft.maxPax || "N/A"}{" "}
                        passengers
                      </p>
                    )}
                  </article>
                </section>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                  Pricing
                </CardTitle>
                <CardDescription>Set price type and amount</CardDescription>
              </CardHeader>
              <CardContent>
                <section className="grid gap-6 md:grid-cols-2">
                  <article className="space-y-2">
                    <Label htmlFor="priceType">Price Type *</Label>
                    <Select
                      value={formData.priceType}
                      onValueChange={(value: "FIXED" | "CONTACT") =>
                        setFormData((prev) => ({ ...prev, priceType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select price type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixed Price</SelectItem>
                        <SelectItem value="CONTACT">
                          Contact for Price
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </article>

                  {formData.priceType === "FIXED" && (
                    <article className="space-y-2">
                      <Label htmlFor="priceUsd">Price (USD) *</Label>
                      <section className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="priceUsd"
                          type="number"
                          placeholder="e.g., 5000"
                          value={formData.priceUsd}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              priceUsd: e.target.value,
                            }))
                          }
                          min="0"
                          step="0.01"
                          className="pl-8"
                        />
                      </section>
                    </article>
                  )}
                </section>
              </CardContent>
            </Card>
          </section>

          {/* Summary Sidebar */}
          <section className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Deal Summary</CardTitle>
                <CardDescription>Review before publishing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Route</p>
                  {selectedDeparture && selectedArrival ? (
                    <p className="font-medium">
                      {selectedDeparture.municipality || selectedDeparture.name}{" "}
                      → {selectedArrival.municipality || selectedArrival.name}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Not selected</p>
                  )}
                </article>

                <Separator />

                {/* Aircraft */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Aircraft</p>
                  {selectedAircraft ? (
                    <p className="font-medium">{selectedAircraft.name}</p>
                  ) : (
                    <p className="text-muted-foreground">Not selected</p>
                  )}
                </article>

                <Separator />

                {/* Schedule */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Departure</p>
                  {departureDate.date && departureDate.time ? (
                    <p className="font-medium">
                      {(() => {
                        // Display date/time directly without timezone conversion
                        const [year, month, day] =
                          departureDate.date!.split("-");
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
                        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year} ${departureDate.time} LT`;
                      })()}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Not set</p>
                  )}
                </article>

                <Separator />

                {/* Seats */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Available Seats
                  </p>
                  <p className="font-medium">
                    {formData.totalSeats || "Not set"}
                  </p>
                </article>

                <Separator />

                {/* Pricing */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Price Type</p>
                  <p className="font-medium">
                    {formData.priceType === "FIXED"
                      ? "Fixed Price"
                      : "Contact for Price"}
                  </p>
                  {formData.priceType === "FIXED" && formData.priceUsd && (
                    <p className="text-xl font-bold text-[#D4AF37]">
                      ${parseFloat(formData.priceUsd || "0").toLocaleString()}
                    </p>
                  )}
                </article>

                <Separator />

                {/* Actions */}
                <section className="space-y-2 pt-4">
                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Publish Empty Leg"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </section>
              </CardContent>
            </Card>
          </section>
        </section>
      </form>
    </section>
  );
}
