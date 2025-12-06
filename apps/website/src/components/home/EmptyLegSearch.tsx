"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, ArrowLeftRight, Users, Search, Loader2 } from "lucide-react";
import { Input, Button, Card, Calendar20 } from "@pexjet/ui";
import { useRouter } from "next/navigation";

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
  const [date, setDate] = useState<{ date?: string | null; time?: string | null }>({
    date: null,
    time: null,
  });
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
      const response = await fetch(`/api/airports?q=${encodeURIComponent(query)}&limit=15`);
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

  const handleSearchChange = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchAirports(query);
    }, 300);
  }, [fetchAirports]);

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

  const handleSubmit = () => {
    const payload = {
      type: "emptyLeg",
      from,
      to,
      date,
      passengers,
    };

    sessionStorage.setItem("emptyLegSearchData", JSON.stringify(payload));
    router.push("/empty-legs");
  };

  const getAirportDisplay = (airport: Airport) => {
    const code = airport.iataCode || airport.icaoCode || "";
    const city = airport.municipality || airport.name;
    return `${code} - ${city}`;
  };

  return (
    <Card className="border border-[#D4AF37]/20 p-2 md:p-6 lg:shadow-xl lg:bg-black/50 h-full ">
      <div className="p-2 md:p-6 bg-white h-full" ref={containerRef}>
        <p className="text-xl font-bold mb-4 text-black uppercase tracking-wide font-serif">
          Empty Leg Deals
        </p>

        <div className="space-y-2">
          {/* From + Swap + To */}
          <div className="flex">
            {/* FROM */}
            <div className="relative flex-1">
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
                          setFrom(getAirportDisplay(airport));
                          setOpenFrom(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="text-sm text-black">
                          <div className="font-medium text-black">
                            {airport.iataCode || airport.icaoCode} - {airport.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {airport.municipality && `${airport.municipality}, `}
                            {airport.region.name}, {airport.country.name}
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
              onClick={swapLocations}
              className="p-2 border border-gray-200 bg-white text-black hover:bg-gray-50"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </Button>

            {/* TO */}
            <div className="relative flex-1">
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
                          setTo(getAirportDisplay(airport));
                          setOpenTo(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="text-sm text-black">
                          <div className="font-medium text-black">
                            {airport.iataCode || airport.icaoCode} - {airport.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {airport.municipality && `${airport.municipality}, `}
                            {airport.region.name}, {airport.country.name}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date using Calendar20 */}
          <Calendar20
            placeholder="Departure Date & Time"
            value={date}
            onChange={setDate}
          />

          {/* Passengers */}
          <div className="flex w-full justify-between items-center px-3 py-1 bg-white border border-gray-300">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="flex gap-2">
              <button
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black"
              >
                −
              </button>
              <span className="w-6 text-center text-black">{passengers}</span>
              <button
                onClick={() => setPassengers(passengers + 1)}
                className="w-7 h-7 inline-flex items-center justify-center border border-gray-300 text-black"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Action button */}
        <Button
          variant="outline"
          onClick={handleSubmit}
          className="w-full mt-4 bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#D4AF37]/90"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Empty Legs
        </Button>
      </div>
    </Card>
  );
}
