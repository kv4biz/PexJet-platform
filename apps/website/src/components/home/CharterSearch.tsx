"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  ArrowLeftRight,
  Users,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Input, Button, Card, Calendar20 } from "@pexjet/ui";
import { useRouter } from "next/navigation";

type TripType = "oneWay" | "roundTrip" | "multiLeg";

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

interface Flight {
  id: string;
  from: string;
  to: string;
  departureDate: { date?: string | null; time?: string | null };
  returnDate: { date?: string | null; time?: string | null };
  passengers: number;
}

export default function CharterSearch() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("oneWay");
  const [flights, setFlights] = useState<Flight[]>([
    {
      id: "1",
      from: "",
      to: "",
      departureDate: { date: null, time: null },
      returnDate: { date: null, time: null },
      passengers: 1,
    },
  ]);
  const [passengers, setPassengers] = useState<number>(1);
  const [openFrom, setOpenFrom] = useState<string | null>(null);
  const [openTo, setOpenTo] = useState<string | null>(null);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAirports = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/airports?q=${encodeURIComponent(query)}&limit=15`,
      );
      if (response.ok) {
        const data = await response.json();
        setAirports(data.airports || []);
      }
    } catch (error) {
      console.error("Failed to fetch airports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchAirports(query);
      }, 300);
    },
    [fetchAirports],
  );

  useEffect(() => {
    // Fetch initial airports
    fetchAirports("");
  }, [fetchAirports]);

  const addFlight = () => {
    setFlights((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        from: "",
        to: "",
        departureDate: { date: null, time: null },
        returnDate: { date: null, time: null },
        passengers: passengers,
      },
    ]);
  };

  const removeFlight = (id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  };

  const swapLocations = (id: string) => {
    setFlights((prev) =>
      prev.map((f) => (f.id === id ? { ...f, from: f.to, to: f.from } : f)),
    );
  };

  const updateFlight = (id: string, updates: Partial<Flight>) => {
    setFlights((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenFrom(null);
        setOpenTo(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleSubmit = () => {
    const payload = {
      type: "charter",
      tripType,
      passengers,
      flights,
    };

    sessionStorage.setItem("charterSearchData", JSON.stringify(payload));
    router.push("/charter");
  };

  const getAirportDisplay = (airport: Airport) => {
    return `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`;
  };

  return (
    <Card className="border border-[#D4AF37]/20 p-2 md:p-2 lg:p-4 z-50 lg:shadow-xl lg:bg-black/50 h-full">
      <div className="p-2 md:p-6 bg-white h-full">
        <p className="text-xl font-bold mb-2 text-black uppercase tracking-wide font-serif">
          Charter Flights
        </p>

        {/* Trip type radio */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-3">
          {[
            { label: "One Way", value: "oneWay" },
            { label: "Round Trip", value: "roundTrip" },
            { label: "Multi-Leg", value: "multiLeg" },
          ].map((t) => (
            <label
              key={t.value}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-black"
            >
              <input
                type="radio"
                name="tripType"
                value={t.value}
                checked={tripType === (t.value as TripType)}
                onChange={() => setTripType(t.value as TripType)}
                className="accent-[#D4AF37] w-4 h-4"
              />
              <span className="text-xs sm:text-sm">{t.label}</span>
            </label>
          ))}
        </div>

        {/* Flight rows */}
        <div className="space-y-2" ref={containerRef}>
          {(tripType === "multiLeg" ? flights : [flights[0]]).map((flight) => (
            <div key={flight.id} className="space-y-2">
              {/* Line 1: From + Swap + To */}
              <div className="flex flex-col gap-2">
                {/* From + Swap on same line */}
                <div className="flex gap-0">
                  {/* FROM */}
                  <div className="relative flex-1">
                    <Input
                      placeholder="From"
                      value={flight.from}
                      onChange={(e) => {
                        updateFlight(flight.id, { from: e.target.value });
                        handleSearchChange(e.target.value);
                      }}
                      onFocus={() => {
                        setOpenFrom(flight.id);
                        setOpenTo(null);
                        handleSearchChange(flight.from);
                      }}
                      className="bg-white text-black border-gray-300 pl-9"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {openFrom === flight.id && (
                      <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-gray-200 shadow-sm max-h-56 overflow-y-auto">
                        {loading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        ) : airports.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No airports found
                          </div>
                        ) : (
                          airports.map((airport) => (
                            <button
                              key={airport.id}
                              onMouseDown={() => {
                                updateFlight(flight.id, {
                                  from: getAirportDisplay(airport),
                                });
                                setOpenFrom(null);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                            >
                              <div className="text-sm text-black">
                                <div className="font-medium text-black">
                                  {airport.iataCode} - {airport.region.name} -{" "}
                                  {airport.name}, {airport.country.name}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Swap Button */}
                  <Button
                    variant="ghost"
                    onClick={() => swapLocations(flight.id)}
                    className="p-2 border border-gray-200 bg-white text-black hover:bg-gray-50 shrink-0"
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* TO - on its own line */}
                <div className="relative w-full">
                  <Input
                    placeholder="To"
                    value={flight.to}
                    onChange={(e) => {
                      updateFlight(flight.id, { to: e.target.value });
                      handleSearchChange(e.target.value);
                    }}
                    onFocus={() => {
                      setOpenTo(flight.id);
                      setOpenFrom(null);
                      handleSearchChange(flight.to);
                    }}
                    className="bg-white text-black border-gray-300 pl-9"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {openTo === flight.id && (
                    <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-gray-200 shadow-sm max-h-56 overflow-y-auto">
                      {loading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : airports.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No airports found
                        </div>
                      ) : (
                        airports.map((airport) => (
                          <button
                            key={airport.id}
                            onMouseDown={() => {
                              updateFlight(flight.id, {
                                to: getAirportDisplay(airport),
                              });
                              setOpenTo(null);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                          >
                            <div className="text-sm text-black">
                              <div className="font-medium text-black">
                                {airport.iataCode} - {airport.region.name} -{" "}
                                {airport.name}, {airport.country.name}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Line 2: Dates using Calendar20 */}
              <div
                className={`flex gap-2 ${
                  tripType === "roundTrip" ? "flex-col md:flex-row" : ""
                }`}
              >
                <div className={tripType === "roundTrip" ? "flex-1" : "w-full"}>
                  <Calendar20
                    placeholder="Departure Date & Time"
                    value={flight.departureDate}
                    onChange={(value) =>
                      updateFlight(flight.id, { departureDate: value })
                    }
                  />
                </div>
                {tripType === "roundTrip" && (
                  <div className="flex-1">
                    <Calendar20
                      placeholder="Return Date & Time"
                      value={flight.returnDate}
                      onChange={(value) =>
                        updateFlight(flight.id, { returnDate: value })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Line 3: Passengers */}
              <div className="flex w-full items-center">
                <div className="flex w-full justify-between items-center px-3 py-1 bg-white border border-gray-300">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(1, passengers - 1);
                        setPassengers(next);
                        updateFlight(flight.id, { passengers: next });
                      }}
                      className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-black">
                      {flight.passengers ?? passengers}
                    </span>
                    <button
                      onClick={() => {
                        const next = passengers + 1;
                        setPassengers(next);
                        updateFlight(flight.id, { passengers: next });
                      }}
                      className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove flight (multi-leg only) */}
                {tripType === "multiLeg" && flights.length > 1 && (
                  <Button
                    variant="destructive"
                    onClick={() => removeFlight(flight.id)}
                    className="bg-white text-red-600 border border-red-200 ml-2"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add flight button */}
          {tripType === "multiLeg" && (
            <Button
              variant="outline"
              onClick={addFlight}
              className="text-[#D4AF37] border-[#D4AF37] bg-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Flight
            </Button>
          )}
        </div>

        {/* Action button */}
        <Button
          variant="outline"
          onClick={handleSubmit}
          className="w-full mt-2 bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#D4AF37]/90"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </Card>
  );
}
