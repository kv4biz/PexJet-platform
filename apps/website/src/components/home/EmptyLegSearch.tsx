"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  ArrowLeftRight,
  Search,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Input,
  Button,
  Card,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@pexjet/ui";
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
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
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

  const handleSubmit = () => {
    const payload = {
      type: "emptyLeg",
      from,
      to,
      startDate,
      endDate,
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
    <Card className="border border-[#D4AF37]/20 p-2 md:p-2 lg:p-4 lg:shadow-xl lg:bg-black/50 h-full ">
      <div className="p-2 md:p-6 bg-white h-full" ref={containerRef}>
        <p className="text-xl font-bold mb-4 md:mb-8 text-black uppercase tracking-wide font-serif">
          Empty Leg Deals
        </p>

        <div className="space-y-2">
          {/* From + Swap + To */}
          <div className="flex flex-col gap-2">
            {/* From + Swap on same line */}
            <div className="flex gap-0">
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
                            setFrom(
                              `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`,
                            );
                            setOpenFrom(false);
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
                onClick={swapLocations}
                className="p-2 border border-gray-200 bg-white text-black hover:bg-gray-50 shrink-0"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </Button>
            </div>

            {/* TO - on its own line */}
            <div className="relative w-full">
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
                          setTo(
                            `${airport.iataCode} - ${airport.region.name} - ${airport.name}, ${airport.country.name}`,
                          );
                          setOpenTo(false);
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

          {/* Start Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? startDate : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const dateStr = `${year}-${month}-${day}`;
                    setStartDate(dateStr);
                    // Auto-set end date to 90 days from start date if not already set
                    if (!endDate) {
                      const endDate = new Date(date);
                      endDate.setDate(endDate.getDate() + 90);
                      const endYear = endDate.getFullYear();
                      const endMonth = String(endDate.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const endDay = String(endDate.getDate()).padStart(2, "0");
                      setEndDate(`${endYear}-${endMonth}-${endDay}`);
                    }
                  }
                }}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? endDate : "End Date (Optional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    // Format date as YYYY-MM-DD using local timezone to avoid timezone offset issues
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setEndDate(`${year}-${month}-${day}`);
                  }
                }}
                disabled={(date) => {
                  const today = new Date(new Date().setHours(0, 0, 0, 0));
                  const start = startDate ? new Date(startDate) : today;
                  return (
                    date < start ||
                    date > new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
                  );
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Action button */}
        <Button
          variant="outline"
          onClick={handleSubmit}
          className="w-full mt-2 bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#D4AF37]/90"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Empty Legs
        </Button>
      </div>
    </Card>
  );
}
