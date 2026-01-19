// components/empty-leg/EmptyLegDealsSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Card,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Badge,
  useToast,
} from "@pexjet/ui";
import {
  Users,
  Calendar,
  ArrowRight,
  DollarSign,
  Clock4,
  Shield,
  Filter,
  Plane,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { EmptyLegLoadingAnimation } from "./EmptyLegLoadingAnimation";

interface Airport {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  iataCode: string;
  icaoCode: string;
  latitude: number;
  longitude: number;
}

interface EmptyLeg {
  id: string;
  slug: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  aircraft: {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    category: string;
    maxPassengers: number;
    images: string[];
  };
  departureDate: string;
  availableSeats: number;
  totalSeats: number;
  priceUsd: number | null;
  priceText: string;
  priceType: string;
  status: string;
  source?: string; // ADMIN, INSTACHARTER, OPERATOR
  ownerType: "admin" | "operator";
}

export function EmptyLegDealsSection() {
  // State
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { toast } = useToast();

  // Search params from hero section
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");

  // Filters
  const [fromRadius, setFromRadius] = useState("0");
  const [toRadius, setToRadius] = useState("0");
  const [priceType, setPriceType] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const dealsPerPage = 10;

  // Fetch empty legs from API
  const fetchEmptyLegs = useCallback(async (params?: URLSearchParams) => {
    try {
      const queryString = params ? `?${params.toString()}` : "";
      const response = await fetch(`/api/empty-legs${queryString}`);
      const data = await response.json();

      if (response.ok) {
        setEmptyLegs(data.emptyLegs || data || []); // Handle both response formats
      } else {
        console.error("API Error:", data.error);
        setEmptyLegs([]);
      }
    } catch (error) {
      console.error("Failed to fetch empty legs:", error);
      setEmptyLegs([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  // Initial load - show loading animation first
  useEffect(() => {
    // Complete initial loading animation after 7.5 seconds, then fetch data
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
      fetchEmptyLegs();
    }, 7500);

    return () => clearTimeout(timer);
  }, [fetchEmptyLegs]);

  // Listen for search events from hero section
  useEffect(() => {
    const handleSearchSubmitted = (event: CustomEvent) => {
      const data = event.detail;
      setSearchPerformed(true);
      setSearchLoading(true);
      setCurrentPage(1);

      // Store search params for filter integration
      setSearchFrom(data.departureAirport || "");
      setSearchTo(data.destinationAirport || "");
      setSearchStartDate(data.startDate || "");
      setSearchEndDate(data.endDate || "");

      // Build search params
      const params = new URLSearchParams();
      if (data.departureAirport) params.set("from", data.departureAirport);
      if (data.destinationAirport) params.set("to", data.destinationAirport);
      if (data.startDate) params.set("startDate", data.startDate);
      if (data.endDate) params.set("endDate", data.endDate);
      if (fromRadius !== "0") params.set("fromRadius", fromRadius);
      if (toRadius !== "0") params.set("toRadius", toRadius);
      if (priceType !== "all") params.set("priceType", priceType);
      params.set("sortBy", "date");
      params.set("sortOrder", sortOrder);

      fetchEmptyLegs(params);

      setTimeout(() => {
        const element = document.getElementById("empty-leg-deals-section");
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    };

    window.addEventListener(
      "emptyLegSearchSubmitted",
      handleSearchSubmitted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "emptyLegSearchSubmitted",
        handleSearchSubmitted as EventListener,
      );
    };
  }, [fetchEmptyLegs, sortOrder, fromRadius, toRadius, priceType]);

  // Apply filters - include search params from hero
  const applyFilters = () => {
    setSearchLoading(true);
    setCurrentPage(1);

    const params = new URLSearchParams();
    // Include search params
    if (searchFrom) params.set("from", searchFrom);
    if (searchTo) params.set("to", searchTo);
    if (searchStartDate) params.set("startDate", searchStartDate);
    if (searchEndDate) params.set("endDate", searchEndDate);
    // Include filters
    if (fromRadius !== "0") params.set("fromRadius", fromRadius);
    if (toRadius !== "0") params.set("toRadius", toRadius);
    if (priceType !== "all") params.set("priceType", priceType);
    params.set("sortBy", "date");
    params.set("sortOrder", sortOrder);

    fetchEmptyLegs(params);
  };

  // Handle sort order change
  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    setSearchLoading(true);

    const params = new URLSearchParams();
    // Include search params
    if (searchFrom) params.set("from", searchFrom);
    if (searchTo) params.set("to", searchTo);
    if (searchStartDate) params.set("startDate", searchStartDate);
    if (searchEndDate) params.set("endDate", searchEndDate);
    // Include filters
    if (fromRadius !== "0") params.set("fromRadius", fromRadius);
    if (toRadius !== "0") params.set("toRadius", toRadius);
    if (priceType !== "all") params.set("priceType", priceType);
    params.set("sortBy", "date");
    params.set("sortOrder", value);

    fetchEmptyLegs(params);
  };

  // Format price in USD
  const formatPrice = (
    priceUsd: number | null,
    priceText?: string,
    priceType?: string,
  ) => {
    if (priceText) return priceText;
    if (priceType === "CONTACT") return "Contact";
    if (priceUsd === null || priceUsd === undefined) return "Contact";
    return `$${priceUsd.toLocaleString()}`;
  };

  // Format duration
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Parse datetime string (handles "2025-12-13 21:24:13.819" format)
  const parseDateTime = (dateString: string | null | undefined): Date => {
    if (!dateString) return new Date(NaN); // Return invalid date if no string
    // Replace space with T to make it ISO 8601 compliant
    const isoString = dateString.replace(" ", "T");
    return new Date(isoString);
  };

  // Format date as LT (local time) - extract raw date without timezone conversion
  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    try {
      // Parse the ISO string and extract date parts directly
      const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return "TBD";
      const [, year, month, day] = match;
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      // Create date in UTC to avoid timezone shifts
      const date = new Date(
        Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
      );
      const dayName = days[date.getUTCDay()];
      const monthName = months[parseInt(month) - 1];
      return `${dayName}, ${monthName} ${parseInt(day)}`;
    } catch {
      return "TBD";
    }
  };

  // Format time as LT (local time) - extract raw time without timezone conversion (24-hour format)
  // For InstaCharter deals, return TBA since they don't provide actual times
  const formatTime = (dateString: string, source?: string) => {
    // InstaCharter deals don't have actual departure times
    if (source === "INSTACHARTER") return "TBA";
    if (!dateString) return "TBD";
    try {
      // Parse the ISO string and extract time parts directly
      const match = dateString.match(/T?(\d{2}):(\d{2})/);
      if (!match) return "TBD";
      const [, hours, minutes] = match;
      return `${hours}:${minutes}`; // 24-hour format, no AM/PM
    } catch {
      return "TBD";
    }
  };

  // Pagination
  const indexOfLastDeal = currentPage * dealsPerPage;
  const indexOfFirstDeal = indexOfLastDeal - dealsPerPage;
  const currentDeals = emptyLegs.slice(indexOfFirstDeal, indexOfLastDeal);
  const totalPages = Math.ceil(emptyLegs.length / dealsPerPage);
  const [slideDirection, setSlideDirection] = useState(0);

  const handlePageChange = (page: number) => {
    setSlideDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
    const element = document.getElementById("empty-leg-deals-grid");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Calculate distance between two airports using Haversine formula
  const calculateDistanceNm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate estimated arrival time as LT (24-hour format)
  // For InstaCharter deals, return TBA since they don't provide actual times
  const calculateArrivalTime = (
    departureDateTime: string,
    distanceNm: number,
    source?: string,
  ): string => {
    // InstaCharter deals don't have actual departure times
    if (source === "INSTACHARTER") return "TBA";
    if (!departureDateTime) return "TBD";
    try {
      const CRUISE_SPEED_KNOTS = 350;
      const flightTimeMinutes = (distanceNm / CRUISE_SPEED_KNOTS + 0.5) * 60; // 30 min buffer

      // Parse departure time from string
      const timeMatch = departureDateTime.match(/T?(\d{2}):(\d{2})/);
      if (!timeMatch) return "TBD";

      const depHours = parseInt(timeMatch[1]);
      const depMinutes = parseInt(timeMatch[2]);
      const totalMinutes =
        depHours * 60 + depMinutes + Math.round(flightTimeMinutes);

      const arrHours = Math.floor(totalMinutes / 60) % 24;
      const arrMinutes = totalMinutes % 60;

      return `${String(arrHours).padStart(2, "0")}:${String(arrMinutes).padStart(2, "0")}`;
    } catch {
      return "TBD";
    }
  };

  // Ticket-style Deal Card
  const TicketCard = ({ deal }: { deal: EmptyLeg }) => {
    const isSoldOut = deal.availableSeats === 0;

    // Calculate distance
    const distanceNm = calculateDistanceNm(
      deal.departureAirport.latitude,
      deal.departureAirport.longitude,
      deal.arrivalAirport.latitude,
      deal.arrivalAirport.longitude,
    );

    // Calculate estimated arrival
    const estArrivalTime = calculateArrivalTime(
      deal.departureDate,
      distanceNm,
      deal.source,
    );

    return (
      <Card
        className={`overflow-hidden hover:border-[#D4AF37] my-2 transition-all ${isSoldOut ? "opacity-60" : ""}`}
      >
        <div className="flex flex-col md:flex-row">
          {/* Left Section - Route Info */}
          <div className="flex-1 p-2 md:p-6">
            {/* Route */}
            <div className="flex items-start md:items-center justify-between mb-4">
              {/* Departure */}
              <div className="w-[30%] lg:w-[25%] text-left">
                <div className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
                  {deal.departureAirport.iataCode ||
                    deal.departureAirport.icaoCode}
                </div>
                <div className="text-sm font-medium text-gray-600 hidden lg:block mt-1">
                  {deal.departureAirport.name}
                </div>
                <div className="text-sm text-gray-600 mt-1 lg:mt-0">
                  {deal.departureAirport.city || deal.departureAirport.region}
                </div>
                <div className="text-sm text-gray-600">
                  {deal.departureAirport.country}
                </div>
              </div>

              {/* Flight Path */}
              <div className="flex-1 px-2 mt-4 md:mt-0">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-full border-t-2 border-dashed border-gray-300" />
                  <div className="relative bg-white px-2">
                    <Plane className="w-5 h-5 text-[#D4AF37]  rotate-45" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-500">
                    {Math.round(distanceNm).toLocaleString()} nm
                  </span>
                </div>
              </div>

              {/* Arrival */}
              <div className="w-[30%] lg:w-[25%]  text-right">
                <div className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
                  {deal.arrivalAirport.iataCode || deal.arrivalAirport.icaoCode}
                </div>
                <div className="text-sm font-medium text-gray-600 hidden lg:block mt-1">
                  {deal.arrivalAirport.name}
                </div>
                <div className="text-sm text-gray-600 mt-1 lg:mt-0">
                  {deal.arrivalAirport.city || deal.arrivalAirport.region}
                </div>
                <div className="text-sm text-gray-600">
                  {deal.arrivalAirport.country}
                </div>
              </div>
            </div>

            {/* Details Row */}
            <div className="grid grid-cols-3 gap-2 text-sm border-t pt-3">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatDate(deal.departureDate)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 justify-center">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>{deal.availableSeats}</span>
              </div>
              <div className="flex items-center text-gray-600 justify-end">
                {deal.aircraft.category}
              </div>
            </div>
          </div>

          {/* Right Section - Price & CTA */}
          <div className="bg-gray-50 p-4 md:p-6 md:w-48 flex flex-row md:flex-col justify-between md:justify-center items-center border-t md:border-t-0 md:border-l border-dashed border-gray-300">
            {/* Price Display */}
            <div className="text-md capitalize md:text-lg font-bold text-[#D4AF37] md:mb-4 text-center">
              {formatPrice(deal.priceUsd, deal.priceText, deal.priceType)}
            </div>

            {/* CTA Button */}
            <Link href={`/empty-legs/${deal.slug}`}>
              <Button
                className={`md:w-full ${isSoldOut ? "bg-gray-400" : "bg-[#D4AF37]"} text-black`}
                disabled={isSoldOut}
              >
                {isSoldOut ? "Sold Out" : "View Deal"}
                {!isSoldOut && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  };

  // Filter Section
  const FilterSection = () => (
    <div className="bg-white p-4 border border-gray-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-[#D4AF37]" />
        <span className="font-semibold text-gray-900">Filters & Sort</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 lg:gap-4">
        {/* From Radius */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">
            Departure Radius
          </Label>
          <Select value={fromRadius} onValueChange={setFromRadius}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Distance</SelectItem>
              <SelectItem value="10">Within 10km</SelectItem>
              <SelectItem value="25">Within 25km</SelectItem>
              <SelectItem value="50">Within 50km</SelectItem>
              <SelectItem value="100">Within 100km</SelectItem>
              <SelectItem value="1000">Within 1000km</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* To Radius */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">
            Arrival Radius
          </Label>
          <Select value={toRadius} onValueChange={setToRadius}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Distance</SelectItem>
              <SelectItem value="10">Within 10km</SelectItem>
              <SelectItem value="25">Within 25km</SelectItem>
              <SelectItem value="50">Within 50km</SelectItem>
              <SelectItem value="100">Within 100km</SelectItem>
              <SelectItem value="1000">Within 1000km</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Type Filter */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Price Type</Label>
          <Select value={priceType} onValueChange={setPriceType}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="fixed">Fixed Price</SelectItem>
              <SelectItem value="contact">Contact for Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Sort Order</Label>
          <Select value={sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Earliest First</SelectItem>
              <SelectItem value="desc">Latest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center gap-4">
          {/* Results Count */}
          <span className="text-sm text-gray-500">
            {emptyLegs.length} deals found
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFromRadius("0");
              setToRadius("0");
              setPriceType("all");
              setSortOrder("asc");
              setSearchPerformed(false);
              setSearchFrom("");
              setSearchTo("");
              setSearchStartDate("");
              setSearchEndDate("");
              fetchEmptyLegs();
            }}
            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </Button>
          <Button onClick={applyFilters} className="bg-[#D4AF37] text-black">
            <Search className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );

  // Empty Leg Explanation Sidebar
  const EmptyLegExplanation = () => (
    <div className="p-6 bg-white border border-gray-200 lg:sticky lg:top-24">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            What Are Empty Leg Deals?
          </h3>
          <p className="text-sm text-gray-600">
            Save up to 75% on private jet flights
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900">Huge Savings</h4>
              <p className="text-sm text-gray-600">
                Empty leg flights cost significantly less than regular charters
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock4 className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900">
                Spontaneous Travel
              </h4>
              <p className="text-sm text-gray-600">
                Perfect for flexible travel schedules and last-minute trips
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900">Same Luxury</h4>
              <p className="text-sm text-gray-600">
                Enjoy the same aircraft and service as regular charters
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-2">How It Works</h4>
          <ol className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-[#D4AF37]">1.</span>
              <span>Private jets need to reposition without passengers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-[#D4AF37]">2.</span>
              <span>These empty legs are offered at discounted rates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-[#D4AF37]">3.</span>
              <span>Book quickly - they're first come, first served!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );

  // Initial loading state - show loading animation
  if (showInitialLoading) {
    return (
      <section id="empty-leg-deals-section" className="py-16 bg-gray-50">
        <div className="w-full lg:w-10/12 mx-auto px-4 lg:px-12">
          <div className="flex justify-center items-center min-h-96">
            <EmptyLegLoadingAnimation
              onComplete={() => {
                setShowInitialLoading(false);
              }}
            />
          </div>
        </div>
      </section>
    );
  }

  // Regular loading state (for subsequent searches)
  if (loading && !showInitialLoading) {
    return (
      <section id="empty-leg-deals-section" className="py-16 bg-gray-50">
        <div className="w-full lg:w-10/12 mx-auto px-4 lg:px-12">
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="empty-leg-deals-section" className="py-16 bg-gray-50">
      <div className="w-full mx-auto px-4 lg:px-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Available Empty Leg Deals
          </h2>
          <p className="text-gray-600">
            {searchPerformed
              ? `Showing ${emptyLegs.length} matching deals`
              : "Discover incredible savings on pre-positioned private jets"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filter Section */}
            <FilterSection />

            {/* Deals Grid */}
            {
              <div id="empty-leg-deals-grid">
                {searchLoading ? (
                  <div className="flex justify-center items-center min-h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                  </div>
                ) : currentDeals.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, x: slideDirection * 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: slideDirection * -100 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      {currentDeals.map((deal) => (
                        <TicketCard key={deal.id} deal={deal} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="text-center p-12 bg-white border border-gray-200">
                    <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Deals Available
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No empty leg deals match your criteria.
                    </p>
                    <Button
                      onClick={() => {
                        setFromRadius("0");
                        setToRadius("0");
                        setPriceType("all");
                        setSortOrder("asc");
                        setSearchPerformed(false);
                        setSearchFrom("");
                        setSearchTo("");
                        setSearchStartDate("");
                        setSearchEndDate("");
                        fetchEmptyLegs();
                      }}
                      className="bg-[#D4AF37] text-black"
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {!searchLoading && totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="icon"
                              onClick={() => handlePageChange(pageNum)}
                              className={
                                currentPage === pageNum
                                  ? "bg-[#D4AF37] text-black"
                                  : ""
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            }
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* What is Empty Leg Explanation */}
            <EmptyLegExplanation />
          </div>
        </div>
      </div>
    </section>
  );
}
