"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2, X, MapPin } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  useToast,
} from "@pexjet/ui";

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

export default function NewsletterCTA() {
  const { toast } = useToast();
  const [subscriptionType, setSubscriptionType] = useState<
    "all" | "cities" | "routes"
  >("all");
  const [subscriptionPhone, setSubscriptionPhone] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Cities selection state
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<Airport[]>([]);
  const [cityResults, setCityResults] = useState<Airport[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
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
          `/api/airports?q=${encodeURIComponent(query)}&limit=10`,
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

  const getAirportDisplay = (airport: Airport) => {
    const code = airport.iataCode || airport.icaoCode || "";
    const city = airport.municipality || airport.name;
    return `${code} - ${city}, ${airport.country.name}`;
  };

  const getAirportShortDisplay = (airport: Airport) => {
    const code = airport.iataCode || airport.icaoCode || "";
    const city = airport.municipality || airport.name;
    return `${code} - ${city}`;
  };

  const handleAddCity = (airport: Airport) => {
    if (!selectedCities.find((c) => c.id === airport.id)) {
      setSelectedCities([...selectedCities, airport]);
    }
    setCitySearchQuery("");
    setCityResults([]);
    setShowCityDropdown(false);
  };

  const handleRemoveCity = (airportId: string) => {
    setSelectedCities(selectedCities.filter((c) => c.id !== airportId));
  };

  const handleSelectRouteFrom = (airport: Airport) => {
    setSelectedRouteFrom(airport);
    setRouteFromQuery(getAirportShortDisplay(airport));
    setShowRouteFromDropdown(false);
  };

  const handleSelectRouteTo = (airport: Airport) => {
    setSelectedRouteTo(airport);
    setRouteToQuery(getAirportShortDisplay(airport));
    setShowRouteToDropdown(false);
  };

  const handleSubscribe = async () => {
    if (!subscriptionPhone) {
      toast({
        title: "Missing Information",
        description: "Please enter your WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    if (subscriptionType === "cities" && selectedCities.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one city",
        variant: "destructive",
      });
      return;
    }

    if (
      subscriptionType === "routes" &&
      (!selectedRouteFrom || !selectedRouteTo)
    ) {
      toast({
        title: "Missing Information",
        description: "Please select both departure and destination airports",
        variant: "destructive",
      });
      return;
    }

    setSubscribing(true);
    try {
      const subscriptionData = {
        type: subscriptionType,
        phone: subscriptionPhone,
        cities: selectedCities
          .map((c) => c.iataCode || c.icaoCode || "")
          .filter(Boolean),
        routeFrom: selectedRouteFrom
          ? selectedRouteFrom.iataCode || selectedRouteFrom.icaoCode || null
          : null,
        routeTo: selectedRouteTo
          ? selectedRouteTo.iataCode || selectedRouteTo.icaoCode || null
          : null,
      };

      const response = await fetch("/api/subscriptions/empty-leg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to subscribe");
      }

      toast({
        title: "Subscription Successful!",
        description: "You will receive empty leg alerts on WhatsApp",
      });

      // Reset form
      setSubscriptionPhone("");
      setSelectedCities([]);
      setSelectedRouteFrom(null);
      setSelectedRouteTo(null);
      setRouteFromQuery("");
      setRouteToQuery("");
      setCitySearchQuery("");
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <section className="py-10 md:py-16 bg-[#0C0C0C]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-3 mb-3 md:mb-4">
              <Bell className="h-6 w-6 md:h-8 md:w-8 text-[#D4AF37]" />
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 md:mb-4 block font-light">
              Get Empty Leg Alerts
            </span>
            <span className="text-gray-400 text-base md:text-lg block px-2">
              Be the first to know about exclusive empty leg deals
            </span>
          </div>

          <Card className="border-0 bg-white/5 backdrop-blur">
            <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
              {/* Subscription Type */}
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">
                  What deals do you want to hear about?
                </Label>
                <Select
                  value={subscriptionType}
                  onValueChange={(v) =>
                    setSubscriptionType(v as "all" | "cities" | "routes")
                  }
                >
                  <SelectTrigger className="bg-white/10 border-gray-700 text-white">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Empty Leg Deals</SelectItem>
                    <SelectItem value="cities">Specific Cities</SelectItem>
                    <SelectItem value="routes">
                      Specific Flight Routes
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cities Selection - shown when "cities" is selected */}
              {subscriptionType === "cities" && (
                <div ref={cityContainerRef}>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Search and select cities
                  </Label>

                  {/* Selected cities badges */}
                  {selectedCities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedCities.map((city) => (
                        <Badge
                          key={city.id}
                          variant="secondary"
                          className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 px-3 py-1"
                        >
                          {getAirportShortDisplay(city)}
                          <button
                            type="button"
                            onClick={() => handleRemoveCity(city.id)}
                            className="ml-2 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* City search input */}
                  <div className="relative">
                    <Input
                      ref={cityInputRef}
                      placeholder="Type city, region or country..."
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      onFocus={() => setShowCityDropdown(true)}
                      className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                    {/* Dropdown */}
                    {showCityDropdown &&
                      (citySearchQuery.length >= 2 ||
                        cityResults.length > 0) && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-700 max-h-60 overflow-y-auto">
                          {cityLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                            </div>
                          ) : cityResults.length > 0 ? (
                            cityResults.map((airport) => (
                              <button
                                key={airport.id}
                                type="button"
                                onClick={() => handleAddCity(airport)}
                                className="w-full text-left px-4 py-3 hover:bg-white/10 transition border-b border-gray-800 last:border-0"
                              >
                                <div className="text-sm text-white font-medium">
                                  {airport.iataCode || airport.icaoCode} -{" "}
                                  {airport.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {airport.municipality &&
                                    `${airport.municipality}, `}
                                  {airport.region.name}, {airport.country.name}
                                </div>
                              </button>
                            ))
                          ) : citySearchQuery.length >= 2 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              No cities found
                            </div>
                          ) : null}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Route Selection - shown when "routes" is selected */}
              {subscriptionType === "routes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* From */}
                  <div ref={routeFromRef}>
                    <Label className="text-xs text-gray-400 mb-2 block">
                      From
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Search departure city..."
                        value={routeFromQuery}
                        onChange={(e) => {
                          setRouteFromQuery(e.target.value);
                          setSelectedRouteFrom(null);
                        }}
                        onFocus={() => setShowRouteFromDropdown(true)}
                        className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 pl-10"
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                      {showRouteFromDropdown &&
                        (routeFromQuery.length >= 2 ||
                          routeFromResults.length > 0) && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-700 max-h-60 overflow-y-auto">
                            {routeFromLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                              </div>
                            ) : routeFromResults.length > 0 ? (
                              routeFromResults.map((airport) => (
                                <button
                                  key={airport.id}
                                  type="button"
                                  onClick={() => handleSelectRouteFrom(airport)}
                                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition border-b border-gray-800 last:border-0"
                                >
                                  <div className="text-sm text-white font-medium">
                                    {airport.iataCode || airport.icaoCode} -{" "}
                                    {airport.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {airport.municipality &&
                                      `${airport.municipality}, `}
                                    {airport.region.name},{" "}
                                    {airport.country.name}
                                  </div>
                                </button>
                              ))
                            ) : routeFromQuery.length >= 2 ? (
                              <div className="p-4 text-sm text-gray-500 text-center">
                                No airports found
                              </div>
                            ) : null}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* To */}
                  <div ref={routeToRef}>
                    <Label className="text-xs text-gray-400 mb-2 block">
                      To
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Search destination city..."
                        value={routeToQuery}
                        onChange={(e) => {
                          setRouteToQuery(e.target.value);
                          setSelectedRouteTo(null);
                        }}
                        onFocus={() => setShowRouteToDropdown(true)}
                        className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 pl-10"
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                      {showRouteToDropdown &&
                        (routeToQuery.length >= 2 ||
                          routeToResults.length > 0) && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-700 max-h-60 overflow-y-auto">
                            {routeToLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                              </div>
                            ) : routeToResults.length > 0 ? (
                              routeToResults.map((airport) => (
                                <button
                                  key={airport.id}
                                  type="button"
                                  onClick={() => handleSelectRouteTo(airport)}
                                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition border-b border-gray-800 last:border-0"
                                >
                                  <div className="text-sm text-white font-medium">
                                    {airport.iataCode || airport.icaoCode} -{" "}
                                    {airport.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {airport.municipality &&
                                      `${airport.municipality}, `}
                                    {airport.region.name},{" "}
                                    {airport.country.name}
                                  </div>
                                </button>
                              ))
                            ) : routeToQuery.length >= 2 ? (
                              <div className="p-4 text-sm text-gray-500 text-center">
                                No airports found
                              </div>
                            ) : null}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Number */}
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">
                  WhatsApp Number *
                </Label>
                <Input
                  placeholder="+234..."
                  value={subscriptionPhone}
                  onChange={(e) => setSubscriptionPhone(e.target.value)}
                  className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Subscribe Button */}
              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                You can unsubscribe at any time
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
