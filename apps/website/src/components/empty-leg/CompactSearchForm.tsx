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
import { Button, Card, Input, DateRangePicker } from "@pexjet/ui";
import { type DateRange } from "react-day-picker";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [passengers, setPassengers] = useState(1);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
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
        if (data.startDate) {
          setDateRange({
            from: new Date(data.startDate),
            to: data.endDate ? new Date(data.endDate) : undefined,
          });
        }

        // Clear the sessionStorage after reading
        sessionStorage.removeItem("emptyLegSearchData");

        // Auto-trigger search if data was present
        if (data.from || data.to) {
          setTimeout(() => {
            const formattedData = {
              departureAirport: data.from || "",
              destinationAirport: data.to || "",
              startDate: data.startDate || "",
              endDate: data.endDate || "",
              passengers: data.passengers || 1,
            };

            onSearch(formattedData);
          }, 500);
        }
      } catch (e) {
        console.error("Failed to parse search data", e);
      }
    }
  }, [onSearch]);

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
    fetchAirports("");
  }, [fetchAirports]);

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
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAirportDisplay = (airport: Airport) => {
    return `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`;
  };

  // Form is always valid - search shows all results if no filters applied
  const isFormValid = () => {
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) return;

    const formattedData = {
      departureAirport: from,
      destinationAirport: to,
      startDate: dateRange?.from ? formatDate(dateRange.from) : "",
      endDate: dateRange?.to ? formatDate(dateRange.to) : "",
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
          <div className="space-y-2" ref={containerRef}>
            <div className="flex flex-col lg:flex-row lg:items-start">
              {/* FROM */}
              <div className="flex w-full lg:flex-1">
                <div className="relative flex-1 min-w-0">
                  <Input
                    placeholder="From"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      handleSearchChange(e.target.value);
                    }}
                    onFocus={() => {
                      setOpenFrom(true);
                      setOpenTo(false);
                      handleSearchChange(from);
                    }}
                    className="bg-white text-black border-gray-300 w-full pl-9"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {openFrom && (
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
                            type="button"
                            onMouseDown={() => {
                              setFrom(getAirportDisplay(airport));
                              setOpenFrom(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                          >
                            <div className="text-sm text-black">
                              <div className="font-medium text-black">
                                {getAirportDisplay(airport)}
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
                  onChange={(e) => {
                    setTo(e.target.value);
                    handleSearchChange(e.target.value);
                  }}
                  onFocus={() => {
                    setOpenTo(true);
                    setOpenFrom(false);
                    handleSearchChange(to);
                  }}
                  className="bg-white text-black border-gray-300 w-full pl-9"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {openTo && (
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
                          type="button"
                          onMouseDown={() => {
                            setTo(getAirportDisplay(airport));
                            setOpenTo(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <div className="text-sm text-black">
                            <div className="font-medium text-black">
                              {getAirportDisplay(airport)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Date Range Picker */}
              <div className="w-full lg:flex-1 lg:min-w-0">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range"
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
