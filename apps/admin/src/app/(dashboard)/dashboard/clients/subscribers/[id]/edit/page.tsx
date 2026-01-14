"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Separator,
  Badge,
  useToast,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Bell,
  Phone,
  MapPin,
  Plane,
  Loader2,
  X,
} from "lucide-react";

interface Airport {
  id: string;
  name: string;
  municipality: string | null;
  iataCode: string | null;
  icaoCode: string | null;
  country: {
    id: string;
    code: string;
    name: string;
  };
  region: {
    id: string;
    code: string;
    name: string;
  };
}

interface Subscriber {
  id: string;
  phone: string;
  type: "ALL" | "CITY" | "ROUTE";
  cities: string[];
  routeFrom: string | null;
  routeTo: string | null;
  isActive: boolean;
  createdAt: string;
}

const subscriptionTypes = [
  {
    value: "ALL",
    label: "All Deals",
    description: "Receive all empty leg notifications",
  },
  {
    value: "CITY",
    label: "By City",
    description: "Receive notifications for specific cities",
  },
  {
    value: "ROUTE",
    label: "By Route",
    description: "Receive notifications for a specific route",
  },
];

export default function EditSubscriberPage() {
  const router = useRouter();
  const params = useParams();
  const subscriberId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingSubscriber, setFetchingSubscriber] = useState(true);
  const [formData, setFormData] = useState({
    phone: "",
    type: "ALL" as "ALL" | "CITY" | "ROUTE",
    cities: [] as string[],
    routeFrom: "",
    routeTo: "",
  });

  // Cities selection state
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<Airport[]>([]);
  const [cityResults, setCityResults] = useState<Airport[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityContainerRef = useRef<HTMLDivElement>(null);

  // Route selection state
  const [routeFromQuery, setRouteFromQuery] = useState("");
  const [routeToQuery, setRouteToQuery] = useState("");
  const [selectedRouteFrom, setSelectedRouteFrom] = useState<Airport | null>(
    null,
  );
  const [selectedRouteTo, setSelectedRouteTo] = useState<Airport | null>(null);
  const [routeFromResults, setRouteFromResults] = useState<Airport[]>([]);
  const [routeToResults, setRouteToResults] = useState<Airport[]>([]);
  const [routeFromLoading, setRouteFromLoading] = useState(false);
  const [routeToLoading, setRouteToLoading] = useState(false);
  const [showRouteFromDropdown, setShowRouteFromDropdown] = useState(false);
  const [showRouteToDropdown, setShowRouteToDropdown] = useState(false);
  const routeFromRef = useRef<HTMLDivElement>(null);
  const routeToRef = useRef<HTMLDivElement>(null);

  // Fetch subscriber data
  useEffect(() => {
    const fetchSubscriber = async () => {
      try {
        setFetchingSubscriber(true);
        const response = await fetch(`/api/subscribers/${subscriberId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const subscriber: Subscriber = data.subscriber;

          setFormData({
            phone: subscriber.phone,
            type: subscriber.type,
            cities: subscriber.cities || [],
            routeFrom: subscriber.routeFrom || "",
            routeTo: subscriber.routeTo || "",
          });

          // Set route display values
          if (subscriber.type === "ROUTE") {
            setRouteFromQuery(subscriber.routeFrom || "");
            setRouteToQuery(subscriber.routeTo || "");
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch subscriber details",
            variant: "destructive",
          });
          router.push("/dashboard/clients?tab=subscribers");
        }
      } catch (error) {
        console.error("Failed to fetch subscriber:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setFetchingSubscriber(false);
      }
    };

    if (subscriberId) {
      fetchSubscriber();
    }
  }, [subscriberId, router, toast]);

  // Debounced search function
  const searchAirports = useCallback(
    async (
      query: string,
      setter: (airports: Airport[]) => void,
      loadingSetter: (loading: boolean) => void,
    ) => {
      if (query.length < 2) {
        setter([]);
        return;
      }

      loadingSetter(true);
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
          setter(data.airports || []);
        }
      } catch (error) {
        console.error("Failed to fetch airports:", error);
      } finally {
        loadingSetter(false);
      }
    },
    [],
  );

  // Debounce city search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearchQuery && showCityDropdown) {
        searchAirports(citySearchQuery, setCityResults, setCityLoading);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [citySearchQuery, showCityDropdown, searchAirports]);

  // Debounce route from search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (routeFromQuery && showRouteFromDropdown) {
        searchAirports(
          routeFromQuery,
          setRouteFromResults,
          setRouteFromLoading,
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [routeFromQuery, showRouteFromDropdown, searchAirports]);

  // Debounce route to search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (routeToQuery && showRouteToDropdown) {
        searchAirports(routeToQuery, setRouteToResults, setRouteToLoading);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [routeToQuery, showRouteToDropdown, searchAirports]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        cityContainerRef.current &&
        !cityContainerRef.current.contains(e.target as Node)
      ) {
        setShowCityDropdown(false);
      }
      if (
        routeFromRef.current &&
        !routeFromRef.current.contains(e.target as Node)
      ) {
        setShowRouteFromDropdown(false);
      }
      if (
        routeToRef.current &&
        !routeToRef.current.contains(e.target as Node)
      ) {
        setShowRouteToDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAirportShortDisplay = (airport: Airport) => {
    const code = airport.iataCode || airport.icaoCode || "";
    const city = airport.municipality || airport.name;
    return `${code} - ${city}`;
  };

  const handleAddCity = (airport: Airport) => {
    const code = airport.iataCode || airport.icaoCode || "";
    if (!selectedCities.find((c) => c.id === airport.id) && code) {
      setSelectedCities([...selectedCities, airport]);
      // Store only IATA/ICAO code for matching
      setFormData((prev) => ({
        ...prev,
        cities: [...prev.cities, code],
      }));
    }
    setCitySearchQuery("");
    setCityResults([]);
    setShowCityDropdown(false);
  };

  const handleRemoveCity = (airportId: string) => {
    const airport = selectedCities.find((c) => c.id === airportId);
    setSelectedCities(selectedCities.filter((c) => c.id !== airportId));
    if (airport) {
      const code = airport.iataCode || airport.icaoCode || "";
      setFormData((prev) => ({
        ...prev,
        cities: prev.cities.filter((c) => c !== code),
      }));
    }
  };

  const handleRemoveCityByName = (cityName: string) => {
    setFormData((prev) => ({
      ...prev,
      cities: prev.cities.filter((c) => c !== cityName),
    }));
  };

  const handleSelectRouteFrom = (airport: Airport) => {
    setSelectedRouteFrom(airport);
    setRouteFromQuery(getAirportShortDisplay(airport));
    setFormData((prev) => ({
      ...prev,
      routeFrom: airport.iataCode || airport.icaoCode || "",
    }));
    setShowRouteFromDropdown(false);
  };

  const handleSelectRouteTo = (airport: Airport) => {
    setSelectedRouteTo(airport);
    setRouteToQuery(getAirportShortDisplay(airport));
    setFormData((prev) => ({
      ...prev,
      routeTo: airport.iataCode || airport.icaoCode || "",
    }));
    setShowRouteToDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on type
    const citiesToSubmit =
      selectedCities.length > 0
        ? selectedCities.map((c) => c.municipality || c.name)
        : formData.cities;

    if (formData.type === "CITY" && citiesToSubmit.length === 0) {
      toast({
        title: "Error",
        description: "At least one city is required for City subscription",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.type === "ROUTE" &&
      (!formData.routeFrom || !formData.routeTo)
    ) {
      toast({
        title: "Error",
        description:
          "Both departure and arrival cities are required for Route subscription",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/subscribers/${subscriberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          type: formData.type,
          cities: formData.type === "CITY" ? citiesToSubmit : [],
          routeFrom: formData.type === "ROUTE" ? formData.routeFrom : null,
          routeTo: formData.type === "ROUTE" ? formData.routeTo : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscriber updated successfully",
        });
        router.push("/dashboard/clients?tab=subscribers");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update subscriber",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update subscriber:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingSubscriber) {
    return (
      <section className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/clients?tab=subscribers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <article>
          <h1 className="text-3xl font-bold">Edit Subscriber</h1>
          <p className="text-muted-foreground">
            Update subscription preferences for {formData.phone}
          </p>
        </article>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <section className="lg:col-span-2 space-y-6">
            {/* Contact Information - Read Only */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[#D4AF37]" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Phone number cannot be changed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <article className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Phone Number</Label>
                  <section className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      disabled
                      className="pl-10 bg-muted cursor-not-allowed"
                    />
                  </section>
                  <p className="text-xs text-muted-foreground">
                    Phone number is read-only and cannot be modified
                  </p>
                </article>
              </CardContent>
            </Card>

            {/* Subscription Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#D4AF37]" />
                  Subscription Type
                </CardTitle>
                <CardDescription>
                  Choose what notifications the subscriber will receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <section className="space-y-4">
                  <article className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "ALL" | "CITY" | "ROUTE") => {
                        setFormData((prev) => ({
                          ...prev,
                          type: value,
                          cities: [],
                          routeFrom: "",
                          routeTo: "",
                        }));
                        setSelectedCities([]);
                        setSelectedRouteFrom(null);
                        setSelectedRouteTo(null);
                        setRouteFromQuery("");
                        setRouteToQuery("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subscription type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {
                        subscriptionTypes.find((t) => t.value === formData.type)
                          ?.description
                      }
                    </p>
                  </article>

                  {/* City Selection - for CITY type */}
                  {formData.type === "CITY" && (
                    <article className="space-y-2" ref={cityContainerRef}>
                      <Label>Cities *</Label>

                      {/* Selected cities badges - from selectedCities state */}
                      {selectedCities.length > 0 && (
                        <section className="flex flex-wrap gap-2 mb-2">
                          {selectedCities.map((city) => (
                            <Badge
                              key={city.id}
                              variant="secondary"
                              className="gap-1 bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30"
                            >
                              {getAirportShortDisplay(city)}
                              <button
                                type="button"
                                onClick={() => handleRemoveCity(city.id)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </section>
                      )}

                      {/* Existing cities from formData (loaded from API) */}
                      {formData.cities.length > 0 &&
                        selectedCities.length === 0 && (
                          <section className="flex flex-wrap gap-2 mb-2">
                            {formData.cities.map((city, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="gap-1 bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30"
                              >
                                {city}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCityByName(city)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </section>
                        )}

                      {/* City search input */}
                      <section className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search city, airport, or country..."
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          onFocus={() => setShowCityDropdown(true)}
                          className="pl-10"
                        />

                        {/* Dropdown */}
                        {showCityDropdown &&
                          (citySearchQuery.length >= 2 ||
                            cityResults.length > 0) && (
                            <section className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border max-h-60 overflow-y-auto shadow-lg">
                              {cityLoading ? (
                                <section className="flex items-center justify-center p-4">
                                  <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                                </section>
                              ) : cityResults.length > 0 ? (
                                cityResults.map((airport) => (
                                  <button
                                    key={airport.id}
                                    type="button"
                                    onClick={() => handleAddCity(airport)}
                                    className="w-full text-left px-4 py-3 hover:bg-accent transition border-b border-border last:border-0"
                                  >
                                    <p className="text-sm font-medium">
                                      {airport.iataCode || airport.icaoCode} -{" "}
                                      {airport.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {airport.municipality &&
                                        `${airport.municipality}, `}
                                      {airport.region?.name},{" "}
                                      {airport.country?.name}
                                    </p>
                                  </button>
                                ))
                              ) : citySearchQuery.length >= 2 ? (
                                <p className="p-4 text-sm text-muted-foreground text-center">
                                  No cities found
                                </p>
                              ) : null}
                            </section>
                          )}
                      </section>
                    </article>
                  )}

                  {/* Route Selection - for ROUTE type */}
                  {formData.type === "ROUTE" && (
                    <section className="grid grid-cols-2 gap-4">
                      {/* From */}
                      <article className="space-y-2" ref={routeFromRef}>
                        <Label htmlFor="routeFrom">From *</Label>
                        <section className="relative">
                          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="routeFrom"
                            placeholder="Search departure city..."
                            value={routeFromQuery}
                            onChange={(e) => {
                              setRouteFromQuery(e.target.value);
                              setSelectedRouteFrom(null);
                            }}
                            onFocus={() => setShowRouteFromDropdown(true)}
                            className="pl-10"
                          />

                          {/* Dropdown */}
                          {showRouteFromDropdown &&
                            (routeFromQuery.length >= 2 ||
                              routeFromResults.length > 0) && (
                              <section className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border max-h-60 overflow-y-auto shadow-lg">
                                {routeFromLoading ? (
                                  <section className="flex items-center justify-center p-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                                  </section>
                                ) : routeFromResults.length > 0 ? (
                                  routeFromResults.map((airport) => (
                                    <button
                                      key={airport.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectRouteFrom(airport)
                                      }
                                      className="w-full text-left px-4 py-3 hover:bg-accent transition border-b border-border last:border-0"
                                    >
                                      <p className="text-sm font-medium">
                                        {airport.iataCode || airport.icaoCode} -{" "}
                                        {airport.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {airport.municipality &&
                                          `${airport.municipality}, `}
                                        {airport.region?.name},{" "}
                                        {airport.country?.name}
                                      </p>
                                    </button>
                                  ))
                                ) : routeFromQuery.length >= 2 ? (
                                  <p className="p-4 text-sm text-muted-foreground text-center">
                                    No airports found
                                  </p>
                                ) : null}
                              </section>
                            )}
                        </section>
                      </article>

                      {/* To */}
                      <article className="space-y-2" ref={routeToRef}>
                        <Label htmlFor="routeTo">To *</Label>
                        <section className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="routeTo"
                            placeholder="Search destination city..."
                            value={routeToQuery}
                            onChange={(e) => {
                              setRouteToQuery(e.target.value);
                              setSelectedRouteTo(null);
                            }}
                            onFocus={() => setShowRouteToDropdown(true)}
                            className="pl-10"
                          />

                          {/* Dropdown */}
                          {showRouteToDropdown &&
                            (routeToQuery.length >= 2 ||
                              routeToResults.length > 0) && (
                              <section className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border max-h-60 overflow-y-auto shadow-lg">
                                {routeToLoading ? (
                                  <section className="flex items-center justify-center p-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                                  </section>
                                ) : routeToResults.length > 0 ? (
                                  routeToResults.map((airport) => (
                                    <button
                                      key={airport.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectRouteTo(airport)
                                      }
                                      className="w-full text-left px-4 py-3 hover:bg-accent transition border-b border-border last:border-0"
                                    >
                                      <p className="text-sm font-medium">
                                        {airport.iataCode || airport.icaoCode} -{" "}
                                        {airport.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {airport.municipality &&
                                          `${airport.municipality}, `}
                                        {airport.region?.name},{" "}
                                        {airport.country?.name}
                                      </p>
                                    </button>
                                  ))
                                ) : routeToQuery.length >= 2 ? (
                                  <p className="p-4 text-sm text-muted-foreground text-center">
                                    No airports found
                                  </p>
                                ) : null}
                              </section>
                            )}
                        </section>
                      </article>
                    </section>
                  )}
                </section>
              </CardContent>
            </Card>
          </section>

          {/* Summary Sidebar */}
          <section className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Subscription Summary</CardTitle>
                <CardDescription>Review changes before saving</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{formData.phone}</p>
                </article>

                <Separator />

                {/* Type */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Subscription Type
                  </p>
                  <Badge variant="outline">
                    {
                      subscriptionTypes.find((t) => t.value === formData.type)
                        ?.label
                    }
                  </Badge>
                </article>

                <Separator />

                {/* Type-specific info */}
                {formData.type === "CITY" && (
                  <>
                    <article className="space-y-1">
                      <p className="text-sm text-muted-foreground">Cities</p>
                      {selectedCities.length > 0 ? (
                        <section className="flex flex-wrap gap-1">
                          {selectedCities.map((city) => (
                            <Badge
                              key={city.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {getAirportShortDisplay(city)}
                            </Badge>
                          ))}
                        </section>
                      ) : formData.cities.length > 0 ? (
                        <section className="flex flex-wrap gap-1">
                          {formData.cities.map((city, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {city}
                            </Badge>
                          ))}
                        </section>
                      ) : (
                        <p className="text-muted-foreground">No cities added</p>
                      )}
                    </article>
                    <Separator />
                  </>
                )}

                {formData.type === "ROUTE" && (
                  <>
                    <article className="space-y-1">
                      <p className="text-sm text-muted-foreground">Route</p>
                      {formData.routeFrom && formData.routeTo ? (
                        <p className="font-medium">
                          {formData.routeFrom} → {formData.routeTo}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">Not set</p>
                      )}
                    </article>
                    <Separator />
                  </>
                )}

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
