// components/empty-leg/CompactSearchForm.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  ArrowLeftRight,
  Users,
  Minus,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Button, Card, Input, Calendar20 } from "@pexjet/ui";

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

interface CompactSearchFormProps {
  onSearch: (data: any) => void;
}

export function CompactSearchForm({ onSearch }: CompactSearchFormProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [fromAirports, setFromAirports] = useState<Airport[]>([]);
  const [toAirports, setToAirports] = useState<Airport[]>([]);
  const [loadingFrom, setLoadingFrom] = useState(false);
  const [loadingTo, setLoadingTo] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialLoadRef = useRef(false);

  // Load search data from sessionStorage on mount (from home page)
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const savedSearch = sessionStorage.getItem("emptyLegSearchData");
    if (savedSearch) {
      try {
        const data = JSON.parse(savedSearch);
        if (data.from) setFrom(data.from);
        if (data.to) setTo(data.to);
        if (data.passengers) setPassengers(data.passengers);
        if (data.date?.date) setDate(data.date.date);
        if (data.date?.time) setTime(data.date.time);

        // Clear the sessionStorage after reading
        sessionStorage.removeItem("emptyLegSearchData");

        // Auto-trigger search if data was present
        if (data.from || data.to) {
          setTimeout(() => {
            const searchData = {
              type: "emptyLeg",
              from: data.from || "",
              to: data.to || "",
              passengers: data.passengers || 1,
              date: data.date?.date || null,
              time: data.date?.time || null,
            };

            const formattedData = {
              departureAirport: searchData.from,
              destinationAirport: searchData.to,
              departureDate: searchData.date || "",
              departureTime: searchData.time || "",
              passengers: searchData.passengers,
            };

            onSearch(formattedData);
          }, 500);
        }
      } catch (e) {
        console.error("Failed to parse search data", e);
      }
    }
  }, [onSearch]);

  // Debounced airport search
  const searchAirports = useCallback(
    async (query: string, type: "from" | "to") => {
      if (query.length < 2) {
        if (type === "from") setFromAirports([]);
        else setToAirports([]);
        return;
      }

      if (type === "from") setLoadingFrom(true);
      else setLoadingTo(true);

      try {
        const response = await fetch(
          `/api/airports?q=${encodeURIComponent(query)}&limit=10`,
        );
        const data = await response.json();
        if (type === "from") setFromAirports(data.airports || []);
        else setToAirports(data.airports || []);
      } catch (error) {
        console.error("Error fetching airports:", error);
      } finally {
        if (type === "from") setLoadingFrom(false);
        else setLoadingTo(false);
      }
    },
    [],
  );

  // Debounce effect for from input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (from && openFrom) searchAirports(from, "from");
    }, 300);
    return () => clearTimeout(timer);
  }, [from, openFrom, searchAirports]);

  // Debounce effect for to input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (to && openTo) searchAirports(to, "to");
    }, 300);
    return () => clearTimeout(timer);
  }, [to, openTo, searchAirports]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenFrom(false);
        setOpenTo(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const swapLocations = () => {
    setFrom(to);
    setTo(from);
  };

  const handleDateChange = (value: {
    date?: string | null;
    time?: string | null;
  }) => {
    setDate(value.date || null);
    setTime(value.time || null);
  };

  // Form is always valid - search shows all results if no filters applied
  const isFormValid = () => {
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) return;

    const searchData = {
      type: "emptyLeg",
      from,
      to,
      passengers,
      date,
      time,
    };

    sessionStorage.setItem("emptyLegSearchData", JSON.stringify(searchData));

    const formattedData = {
      departureAirport: from,
      destinationAirport: to,
      departureDate: date || "",
      departureTime: time || "",
      passengers,
    };

    onSearch(formattedData);
  };

  return (
    <Card className="border border-[#D4AF37]/20 p-2 md:p-6 lg:shadow-xl lg:bg-black/50 h-full">
      <div className="p-0 md:p-6 bg-white h-full">
        <p className="text-xl font-bold mb-2 text-black uppercase tracking-wide">
          Empty Leg Flights
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Significant savings on pre-positioned aircraft
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-0" ref={containerRef}>
            <div className="flex flex-col lg:flex-row lg:items-start">
              {/* FROM */}
              <div className="flex w-full lg:flex-1">
                <div className="relative flex-1 min-w-0">
                  <Input
                    placeholder="From"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    onFocus={() => setOpenFrom(true)}
                    className="bg-white text-black border-gray-300 w-full pl-10"
                  />
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  {openFrom &&
                    (from.length >= 2 || fromAirports.length > 0) && (
                      <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-gray-200 shadow-sm max-h-56 overflow-y-auto">
                        {loadingFrom ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                          </div>
                        ) : fromAirports.length > 0 ? (
                          fromAirports.map((airport) => (
                            <button
                              key={airport.id}
                              type="button"
                              onMouseDown={() => {
                                setFrom(
                                  `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`,
                                );
                                setOpenFrom(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                            >
                              <div className="text-sm text-black">
                                <div className="font-medium text-black">
                                  {airport.iataCode} - {airport.region.name} -{" "}
                                  {airport.name}, {airport.country.name}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : from.length >= 2 ? (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            No airports found
                          </div>
                        ) : null}
                      </div>
                    )}
                </div>

                {/* Swap Button */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={swapLocations}
                  className="p-2 border border-gray-200 bg-white text-black hover:bg-gray-50 shrink-0"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </Button>
              </div>

              {/* TO */}
              <div className="relative w-full lg:flex-1 lg:min-w-0">
                <Input
                  placeholder="To"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onFocus={() => setOpenTo(true)}
                  className="bg-white text-black border-gray-300 w-full pl-10"
                />
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                {openTo && (to.length >= 2 || toAirports.length > 0) && (
                  <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-gray-200 shadow-sm max-h-56 overflow-y-auto">
                    {loadingTo ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                      </div>
                    ) : toAirports.length > 0 ? (
                      toAirports.map((airport) => (
                        <button
                          key={airport.id}
                          type="button"
                          onMouseDown={() => {
                            setTo(
                              `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`,
                            );
                            setOpenTo(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                        >
                          <div className="text-sm text-black">
                            <div className="font-medium text-black">
                              {airport.iataCode} - {airport.region.name} -{" "}
                              {airport.name}, {airport.country.name}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : to.length >= 2 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No airports found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Date input */}
              <div className="w-full lg:flex-1 lg:min-w-0">
                <Calendar20
                  placeholder="Departure Date & Time"
                  value={
                    date
                      ? {
                          date: date,
                          time: time || undefined,
                        }
                      : undefined
                  }
                  onChange={handleDateChange}
                />
              </div>

              {/* Passengers */}
              <div className="flex items-center w-full lg:flex-1">
                <div className="flex w-full items-center px-3 pt-1 pb-1.5 bg-white border border-gray-300 justify-between">
                  <Users className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex gap-2 items-center ml-2">
                    <button
                      type="button"
                      onClick={() => setPassengers(Math.max(1, passengers - 1))}
                      className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-black text-sm">
                      {passengers}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPassengers(passengers + 1)}
                      className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-2">
            <Button
              type="submit"
              variant="outline"
              disabled={!isFormValid()}
              className={`w-full py-2 ${isFormValid() ? "bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#D4AF37]/90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Empty Legs
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
