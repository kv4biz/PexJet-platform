"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  ArrowLeft,
  Search,
} from "lucide-react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useToast,
} from "@pexjet/ui";
import { cn } from "@pexjet/ui";
import Link from "next/link";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  passengerCapacityMax: number;
}

interface Airport {
  id: string;
  name: string;
  municipality: string;
  iataCode: string;
  icaoCode: string;
  country: { name: string };
}

export default function NewEmptyLegPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fleet, setFleet] = useState<Aircraft[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [searchingAirports, setSearchingAirports] = useState(false);

  const [departureOpen, setDepartureOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);

  const [formData, setFormData] = useState({
    aircraftId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    departureDateTime: "",
    totalSeats: "",
    availableSeats: "",
    originalPriceNgn: "",
    discountPriceNgn: "",
  });

  const [selectedDeparture, setSelectedDeparture] = useState<Airport | null>(
    null,
  );
  const [selectedArrival, setSelectedArrival] = useState<Airport | null>(null);

  useEffect(() => {
    fetchFleet();
  }, []);

  const fetchFleet = async () => {
    try {
      const response = await fetch("/api/fleet", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFleet(data.fleet);
      }
    } catch (error) {
      console.error("Failed to fetch fleet:", error);
    }
  };

  const searchAirports = async (query: string) => {
    if (query.length < 2) {
      setAirports([]);
      return;
    }

    setSearchingAirports(true);
    try {
      const response = await fetch(
        `/api/airports/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAirports(data.airports);
      }
    } catch (error) {
      console.error("Failed to search airports:", error);
    } finally {
      setSearchingAirports(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.aircraftId) {
      toast({
        title: "Error",
        description: "Please select an aircraft",
        variant: "destructive",
      });
      return;
    }

    if (!formData.departureAirportId || !formData.arrivalAirportId) {
      toast({
        title: "Error",
        description: "Please select departure and arrival airports",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/empty-legs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          ...formData,
          totalSeats: parseInt(formData.totalSeats),
          availableSeats: parseInt(formData.availableSeats),
          originalPriceNgn: parseFloat(formData.originalPriceNgn),
          discountPriceNgn: parseFloat(formData.discountPriceNgn),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create empty leg");
      }

      toast({
        title: "Empty Leg Created",
        description: "Your empty leg deal has been published",
      });

      router.push("/dashboard/empty-legs");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAircraft = fleet.find((a) => a.id === formData.aircraftId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/empty-legs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Empty Leg Deal</h1>
          <p className="text-muted-foreground">
            Fill in the details for your empty leg flight
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Aircraft Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-gold-500" />
                Aircraft
              </CardTitle>
              <CardDescription>
                Select an aircraft from your fleet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.aircraftId}
                onValueChange={(value) =>
                  setFormData({ ...formData, aircraftId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {fleet.length > 0 ? (
                    fleet.map((aircraft) => (
                      <SelectItem key={aircraft.id} value={aircraft.id}>
                        {aircraft.name} ({aircraft.passengerCapacityMax} pax)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No aircraft in fleet
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {fleet.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  <Link
                    href="/dashboard/fleet"
                    className="text-gold-500 hover:underline"
                  >
                    Add aircraft to your fleet
                  </Link>{" "}
                  to create empty leg deals
                </p>
              )}
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold-500" />
                Date & Time
              </CardTitle>
              <CardDescription>When is the flight departing?</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="datetime-local"
                value={formData.departureDateTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    departureDateTime: e.target.value,
                  })
                }
                required
              />
            </CardContent>
          </Card>

          {/* Departure Airport */}
          <Card>
            <CardHeader>
              <CardTitle>Departure Airport</CardTitle>
              <CardDescription>
                Where is the flight departing from?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedDeparture
                      ? `${selectedDeparture.iataCode || selectedDeparture.icaoCode} - ${selectedDeparture.municipality}`
                      : "Search airports..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search airports..."
                      onValueChange={(value) => searchAirports(value)}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchingAirports
                          ? "Searching..."
                          : "No airports found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {airports.map((airport) => (
                          <CommandItem
                            key={airport.id}
                            value={airport.id}
                            onSelect={() => {
                              setSelectedDeparture(airport);
                              setFormData({
                                ...formData,
                                departureAirportId: airport.id,
                              });
                              setDepartureOpen(false);
                            }}
                          >
                            <span className="font-medium">
                              {airport.iataCode || airport.icaoCode}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              {airport.municipality}, {airport.country.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Arrival Airport */}
          <Card>
            <CardHeader>
              <CardTitle>Arrival Airport</CardTitle>
              <CardDescription>Where is the flight going?</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={arrivalOpen} onOpenChange={setArrivalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedArrival
                      ? `${selectedArrival.iataCode || selectedArrival.icaoCode} - ${selectedArrival.municipality}`
                      : "Search airports..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search airports..."
                      onValueChange={(value) => searchAirports(value)}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchingAirports
                          ? "Searching..."
                          : "No airports found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {airports.map((airport) => (
                          <CommandItem
                            key={airport.id}
                            value={airport.id}
                            onSelect={() => {
                              setSelectedArrival(airport);
                              setFormData({
                                ...formData,
                                arrivalAirportId: airport.id,
                              });
                              setArrivalOpen(false);
                            }}
                          >
                            <span className="font-medium">
                              {airport.iataCode || airport.icaoCode}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              {airport.municipality}, {airport.country.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Seats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gold-500" />
                Seats
              </CardTitle>
              <CardDescription>How many seats are available?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Seats</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedAircraft?.passengerCapacityMax || 20}
                    value={formData.totalSeats}
                    onChange={(e) =>
                      setFormData({ ...formData, totalSeats: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Seats</Label>
                  <Input
                    type="number"
                    min="1"
                    max={formData.totalSeats || 20}
                    value={formData.availableSeats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        availableSeats: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold-500" />
                Pricing (NGN)
              </CardTitle>
              <CardDescription>Set the price per seat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g., 500000"
                    value={formData.originalPriceNgn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPriceNgn: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g., 350000"
                    value={formData.discountPriceNgn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPriceNgn: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              {formData.originalPriceNgn && formData.discountPriceNgn && (
                <p className="text-sm text-gold-500">
                  {Math.round(
                    ((parseFloat(formData.originalPriceNgn) -
                      parseFloat(formData.discountPriceNgn)) /
                      parseFloat(formData.originalPriceNgn)) *
                      100,
                  )}
                  % discount
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/empty-legs">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fleet.length === 0}
            className="bg-gold-500 text-black hover:bg-gold-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Empty Leg"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
