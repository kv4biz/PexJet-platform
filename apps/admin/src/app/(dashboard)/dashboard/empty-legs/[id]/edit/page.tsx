"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Loader2,
  Search,
} from "lucide-react";

interface Aircraft {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  passengerCapacityMax: number;
  cruiseSpeedKnots: number;
  thumbnailImage: string | null;
}

interface Airport {
  id: string;
  name: string;
  municipality: string | null;
  iataCode: string | null;
  icaoCode: string | null;
  countryCode: string;
}

interface EmptyLegData {
  id: string;
  slug: string;
  status: string;
  originalPriceNgn: number;
  discountPriceNgn: number;
  totalSeats: number;
  availableSeats: number;
  departureDateTime: string;
  aircraftId: string;
  departureAirportId: string;
  arrivalAirportId: string;
  aircraft: Aircraft;
  departureAirport: Airport;
  arrivalAirport: Airport;
}

export default function EditEmptyLegPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    availableSeats: "",
    originalPriceNgn: "",
    discountPriceNgn: "",
    status: "",
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

  // Fetch data on mount
  useEffect(() => {
    if (params.id) {
      Promise.all([fetchEmptyLeg(), fetchAircraft()]);
    }
  }, [params.id]);

  const fetchEmptyLeg = async () => {
    try {
      const response = await fetch(`/api/empty-legs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data: EmptyLegData = await response.json();

        // Populate form
        setFormData({
          aircraftId: data.aircraft.id,
          departureAirportId: data.departureAirport.id,
          arrivalAirportId: data.arrivalAirport.id,
          totalSeats: data.totalSeats.toString(),
          availableSeats: data.availableSeats.toString(),
          originalPriceNgn: data.originalPriceNgn.toString(),
          discountPriceNgn: data.discountPriceNgn.toString(),
          status: data.status,
        });

        // Set departure date/time for Calendar20
        const depDate = new Date(data.departureDateTime);
        setDepartureDate({
          date: `${depDate.getFullYear()}-${String(depDate.getMonth() + 1).padStart(2, "0")}-${String(depDate.getDate()).padStart(2, "0")}`,
          time: `${String(depDate.getHours()).padStart(2, "0")}:${String(depDate.getMinutes()).padStart(2, "0")}`,
        });

        setSelectedAircraft(data.aircraft);
        setSelectedDeparture(data.departureAirport);
        setSelectedArrival(data.arrivalAirport);
        setDepartureSearch(
          `${data.departureAirport.municipality || data.departureAirport.name} (${data.departureAirport.iataCode || data.departureAirport.icaoCode})`,
        );
        setArrivalSearch(
          `${data.arrivalAirport.municipality || data.arrivalAirport.name} (${data.arrivalAirport.iataCode || data.arrivalAirport.icaoCode})`,
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to load empty leg",
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
      if (departureSearch.length >= 2 && !selectedDeparture) {
        searchAirports(departureSearch, "departure");
      } else {
        setDepartureResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [departureSearch, selectedDeparture]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arrivalSearch.length >= 2 && !selectedArrival) {
        searchAirports(arrivalSearch, "arrival");
      } else {
        setArrivalResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [arrivalSearch, selectedArrival]);

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
    if (type === "departure") {
      setSelectedDeparture(airport);
      setFormData((prev) => ({ ...prev, departureAirportId: airport.id }));
      setDepartureSearch(
        `${airport.municipality || airport.name} (${airport.iataCode || airport.icaoCode})`,
      );
      setShowDepartureDropdown(false);
    } else {
      setSelectedArrival(airport);
      setFormData((prev) => ({ ...prev, arrivalAirportId: airport.id }));
      setArrivalSearch(
        `${airport.municipality || airport.name} (${airport.iataCode || airport.icaoCode})`,
      );
      setShowArrivalDropdown(false);
    }
  };

  const handleAircraftChange = (aircraftId: string) => {
    const aircraft = aircraftList.find((a) => a.id === aircraftId);
    setSelectedAircraft(aircraft || null);
    setFormData((prev) => ({
      ...prev,
      aircraftId,
    }));
  };

  const calculateDiscount = () => {
    const original = parseFloat(formData.originalPriceNgn) || 0;
    const discount = parseFloat(formData.discountPriceNgn) || 0;
    if (original > 0 && discount > 0) {
      return Math.round(((original - discount) / original) * 100);
    }
    return 0;
  };

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
    if (
      parseFloat(formData.discountPriceNgn) >=
      parseFloat(formData.originalPriceNgn)
    ) {
      toast({
        title: "Error",
        description: "Discount price must be less than original price",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Combine date and time into ISO datetime string
      const departureDateTime = `${departureDate.date}T${departureDate.time}:00`;

      const response = await fetch(`/api/empty-legs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ ...formData, departureDateTime }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Empty leg updated successfully",
        });
        router.push(`/dashboard/empty-legs/${params.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update empty leg",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update empty leg:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/empty-legs/${params.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <article>
          <h1 className="text-3xl font-bold">Edit Empty Leg</h1>
          <p className="text-muted-foreground">Update empty leg deal details</p>
        </article>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <section className="lg:col-span-2 space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Aircraft Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[#D4AF37]" />
                  Aircraft
                </CardTitle>
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
                        <SelectValue placeholder="Select aircraft" />
                      </SelectTrigger>
                      <SelectContent>
                        {aircraftList.map((aircraft) => (
                          <SelectItem key={aircraft.id} value={aircraft.id}>
                            {aircraft.name} ({aircraft.manufacturer}{" "}
                            {aircraft.model})
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
                          Max Passengers:{" "}
                          {selectedAircraft.passengerCapacityMax}
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
                        placeholder="Search city, airport, or code..."
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
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </section>
                    {showDepartureDropdown && departureResults.length > 0 && (
                      <section className="absolute z-50 w-full mt-1 bg-background border shadow-lg max-h-60 overflow-auto">
                        {departureResults.map((airport) => (
                          <button
                            key={airport.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted flex flex-col"
                            onClick={() => selectAirport(airport, "departure")}
                          >
                            <span className="font-medium">
                              {airport.municipality || airport.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {airport.name} (
                              {airport.iataCode || airport.icaoCode})
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
                        placeholder="Search city, airport, or code..."
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
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </section>
                    {showArrivalDropdown && arrivalResults.length > 0 && (
                      <section className="absolute z-50 w-full mt-1 bg-background border shadow-lg max-h-60 overflow-auto">
                        {arrivalResults.map((airport) => (
                          <button
                            key={airport.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted flex flex-col"
                            onClick={() => selectAirport(airport, "arrival")}
                          >
                            <span className="font-medium">
                              {airport.municipality || airport.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {airport.name} (
                              {airport.iataCode || airport.icaoCode})
                            </span>
                          </button>
                        ))}
                      </section>
                    )}
                  </article>
                </section>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-[#D4AF37]" />
                  Schedule & Seats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <section className="grid gap-6 md:grid-cols-3">
                  <article className="space-y-2">
                    <Label>Departure Date & Time *</Label>
                    <Calendar20
                      placeholder="Select departure date & time"
                      value={departureDate}
                      onChange={setDepartureDate}
                    />
                  </article>

                  <article className="space-y-2">
                    <Label htmlFor="totalSeats">Total Seats *</Label>
                    <Input
                      id="totalSeats"
                      type="number"
                      value={formData.totalSeats}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          totalSeats: e.target.value,
                        }))
                      }
                      min="1"
                    />
                  </article>

                  <article className="space-y-2">
                    <Label htmlFor="availableSeats">Available Seats *</Label>
                    <Input
                      id="availableSeats"
                      type="number"
                      value={formData.availableSeats}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          availableSeats: e.target.value,
                        }))
                      }
                      min="0"
                      max={formData.totalSeats}
                    />
                  </article>
                </section>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                  Pricing (per seat)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <section className="grid gap-6 md:grid-cols-2">
                  <article className="space-y-2">
                    <Label htmlFor="originalPriceNgn">
                      Original Price (NGN) *
                    </Label>
                    <section className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        id="originalPriceNgn"
                        type="number"
                        value={formData.originalPriceNgn}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            originalPriceNgn: e.target.value,
                          }))
                        }
                        min="0"
                        step="1000"
                        className="pl-8"
                      />
                    </section>
                  </article>

                  <article className="space-y-2">
                    <Label htmlFor="discountPriceNgn">
                      Discount Price (NGN) *
                    </Label>
                    <section className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        id="discountPriceNgn"
                        type="number"
                        value={formData.discountPriceNgn}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discountPriceNgn: e.target.value,
                          }))
                        }
                        min="0"
                        step="1000"
                        className="pl-8"
                      />
                    </section>
                  </article>
                </section>

                {calculateDiscount() > 0 && (
                  <article className="mt-4 p-4 bg-green-500/10 border border-green-500/20">
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      {calculateDiscount()}% discount
                    </p>
                  </article>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Sidebar */}
          <section className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Aircraft</p>
                  {selectedAircraft ? (
                    <p className="font-medium">{selectedAircraft.name}</p>
                  ) : (
                    <p className="text-muted-foreground">Not selected</p>
                  )}
                </article>

                <Separator />

                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Price per Seat
                  </p>
                  {formData.discountPriceNgn ? (
                    <section>
                      <p className="text-sm line-through text-muted-foreground">
                        ₦
                        {parseFloat(
                          formData.originalPriceNgn || "0",
                        ).toLocaleString()}
                      </p>
                      <p className="text-xl font-bold text-[#D4AF37]">
                        ₦
                        {parseFloat(formData.discountPriceNgn).toLocaleString()}
                      </p>
                    </section>
                  ) : (
                    <p className="text-muted-foreground">Not set</p>
                  )}
                </article>

                <Separator />

                <section className="space-y-2 pt-4">
                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    disabled={saving}
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
