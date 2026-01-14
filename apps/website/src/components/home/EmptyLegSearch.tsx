"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  ArrowLeftRight,
  Search,
  Loader2,
  Users,
  Plus,
  Minus,
} from "lucide-react";
import { Input, Button, Card, DateRangePicker } from "@pexjet/ui";
import { useRouter } from "next/navigation";
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

export default function EmptyLegSearch() {
  const router = useRouter();
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

  const handleSubmit = () => {
    const payload = {
      type: "emptyLeg",
      from,
      to,
      startDate: dateRange?.from ? formatDate(dateRange.from) : null,
      endDate: dateRange?.to ? formatDate(dateRange.to) : null,
      passengers,
    };

    sessionStorage.setItem("emptyLegSearchData", JSON.stringify(payload));
    router.push("/empty-legs");
  };

  const getAirportDisplay = (airport: Airport) => {
    return `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`;
  };

  return (
    <Card className="border border-[#D4AF37]/20 p-2 md:p-2 lg:p-4 lg:shadow-xl lg:bg-black/50 h-full ">
      <section className="p-2 md:p-6 bg-white h-full" ref={containerRef}>
        <p className="text-xl font-bold mb-4 md:mb-8 text-black uppercase tracking-wide font-serif">
          Empty Leg Deals
        </p>

        <section className="space-y-2">
          {/* From + Swap + To */}
          <section className="flex flex-col gap-2">
            {/* From + Swap on same line */}
            <section className="flex gap-0">
              {/* FROM */}
              <article className="relative flex-1">
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
                  className="bg-white text-black border-gray-300 pl-10"
                />
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                {openFrom && (
                  <section className="absolute z-40 left-0 right-0 mt-2 bg-white border border-gray-200 shadow-sm max-h-56 overflow-y-auto">
                    {loading ? (
                      <section className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </section>
                    ) : airports.length === 0 ? (
                      <section className="px-4 py-3 text-sm text-gray-500">
                        No airports found
                      </section>
                    ) : (
                      airports.map((airport) => (
                        <button
                          key={airport.id}
                          onMouseDown={() => {
                            setFrom(getAirportDisplay(airport));
                            setOpenFrom(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <span className="text-sm font-medium text-black">
                            {airport.iataCode} - {airport.region.name} -{" "}
                            {airport.name}, {airport.country.name}
                          </span>
                        </button>
                      ))
                    )}
                  </section>
                )}
              </article>

              {/* Swap Button */}
              <Button
                variant="ghost"
                onClick={swapLocations}
                className="p-2 border border-gray-200 bg-white text-black hover:bg-gray-50 shrink-0"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </Button>
            </section>

            {/* TO - on its own line */}
            <article className="relative w-full">
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
                className="bg-white text-black border-gray-300 pl-10"
              />
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              {openTo && (
                <section className="absolute z-40 left-0 right-0 mt-2 bg-white border border-gray-200 shadow-sm max-h-56 overflow-y-auto">
                  {loading ? (
                    <section className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </section>
                  ) : airports.length === 0 ? (
                    <section className="px-4 py-3 text-sm text-gray-500">
                      No airports found
                    </section>
                  ) : (
                    airports.map((airport) => (
                      <button
                        key={airport.id}
                        onMouseDown={() => {
                          setTo(getAirportDisplay(airport));
                          setOpenTo(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <span className="text-sm font-medium text-black">
                          {airport.iataCode} - {airport.region.name} -{" "}
                          {airport.name}, {airport.country.name}
                        </span>
                      </button>
                    ))
                  )}
                </section>
              )}
            </article>
          </section>

          {/* Date Range Picker */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range"
          />

          {/* Passengers */}
          <section className="flex w-full items-center">
            <section className="flex w-full justify-between items-center px-3 py-2 bg-white border border-gray-300">
              <section className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Passengers</span>
              </section>
              <section className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-black text-sm">
                  {passengers}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengers(passengers + 1)}
                  className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </section>
            </section>
          </section>
        </section>

        {/* Action button */}
        <Button
          variant="outline"
          onClick={handleSubmit}
          className="w-full mt-2 bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#D4AF37]/90"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </section>
    </Card>
  );
}
