// components/empty-leg/EmptyLegDealsSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { emptyLegsPageData } from "@/data";

interface Airport {
  id: string;
  name: string;
  city: string;
  country: string;
  code: string;
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
  };
  departureDate: string;
  availableSeats: number;
  totalSeats: number;
  priceUsd: number;
  originalPriceUsd: number;
  discountPercent: number;
  status: string;
}

export function EmptyLegDealsSection() {
  // State
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { toast } = useToast();

  // Filters (removed fromAirport and toAirport - using hero search instead)
  const [fromRadius, setFromRadius] = useState("0");
  const [toRadius, setToRadius] = useState("0");
  const [minDiscount, setMinDiscount] = useState("0");
  const [sortBy, setSortBy] = useState("date");

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
        setEmptyLegs(data.emptyLegs || []);
      }
    } catch (error) {
      console.error("Failed to fetch empty legs:", error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmptyLegs();
  }, [fetchEmptyLegs]);

  // Listen for search events from hero section
  useEffect(() => {
    const handleSearchSubmitted = (event: CustomEvent) => {
      const data = event.detail;
      setSearchPerformed(true);
      setSearchLoading(true);
      setCurrentPage(1);

      // Build search params
      const params = new URLSearchParams();
      if (data.departureAirport) params.set("from", data.departureAirport);
      if (data.destinationAirport) params.set("to", data.destinationAirport);
      if (data.departureDate) params.set("date", data.departureDate);
      if (data.passengers) params.set("passengers", data.passengers.toString());
      params.set("sortBy", sortBy);

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
  }, [fetchEmptyLegs, sortBy]);

  // Apply filters
  const applyFilters = () => {
    setSearchLoading(true);
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (fromRadius !== "0") params.set("fromRadius", fromRadius);
    if (toRadius !== "0") params.set("toRadius", toRadius);
    if (minDiscount !== "0") params.set("minDiscount", minDiscount);
    params.set("sortBy", sortBy);

    fetchEmptyLegs(params);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setSearchLoading(true);

    const params = new URLSearchParams();
    if (fromRadius !== "0") params.set("fromRadius", fromRadius);
    if (toRadius !== "0") params.set("toRadius", toRadius);
    if (minDiscount !== "0") params.set("minDiscount", minDiscount);
    params.set("sortBy", value);

    fetchEmptyLegs(params);
  };

  // Format price in USD
  const formatPrice = (priceUsd: number) => {
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = parseDateTime(dateString);
    if (isNaN(date.getTime())) return "TBD";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = parseDateTime(dateString);
    if (isNaN(date.getTime())) return "TBD";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Pagination
  const indexOfLastDeal = currentPage * dealsPerPage;
  const indexOfFirstDeal = indexOfLastDeal - dealsPerPage;
  const currentDeals = emptyLegs.slice(indexOfFirstDeal, indexOfLastDeal);
  const totalPages = Math.ceil(emptyLegs.length / dealsPerPage);

  const handlePageChange = (page: number) => {
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

  // Calculate estimated arrival time
  const calculateArrivalTime = (
    departureDateTime: string,
    distanceNm: number,
  ): string => {
    const CRUISE_SPEED_KNOTS = 350;
    const flightTimeHours = distanceNm / CRUISE_SPEED_KNOTS + 0.5; // 30 min buffer
    const departure = parseDateTime(departureDateTime);
    if (isNaN(departure.getTime())) return "TBD";
    const arrivalMs = departure.getTime() + flightTimeHours * 60 * 60 * 1000;
    const arrival = new Date(arrivalMs);
    return arrival.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
    const estArrivalTime = calculateArrivalTime(deal.departureDate, distanceNm);

    return (
      <Link href={`/empty-legs/${deal.slug}`}>
        <Card
          className={`overflow-hidden hover:border-[#D4AF37] transition-all cursor-pointer ${isSoldOut ? "opacity-60" : ""}`}
        >
          <div className="flex flex-col md:flex-row">
            {/* Left Section - Route Info */}
            <div className="flex-1 p-4 md:p-6">
              {/* Discount Badge */}
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-red-500 text-white px-3 py-1">
                  {deal.discountPercent}% OFF
                </Badge>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between mb-4">
                {/* Departure */}
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {deal.departureAirport.code}
                  </div>
                  <div className="text-sm text-gray-600 max-w-[100px] truncate">
                    {deal.departureAirport.city}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(deal.departureDate)}
                  </div>
                </div>

                {/* Flight Path */}
                <div className="flex-1 px-4 md:px-8">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-full border-t-2 border-dashed border-gray-300" />
                    <div className="relative bg-white px-2">
                      <Plane className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs text-gray-500">
                      {Math.round(distanceNm).toLocaleString()} nm
                    </span>
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {deal.arrivalAirport.code}
                  </div>
                  <div className="text-sm text-gray-600 max-w-[100px] truncate">
                    {deal.arrivalAirport.city}
                  </div>
                  <div className="text-xs text-gray-400">{estArrivalTime}</div>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(deal.departureDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {deal.availableSeats}/{deal.totalSeats} seats
                  </span>
                </div>
                <div className="text-gray-600 hidden md:block">
                  {deal.aircraft.name}
                </div>
              </div>
            </div>

            {/* Right Section - Price & CTA */}
            <div className="bg-gray-50 p-4 md:p-6 md:w-48 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-dashed border-gray-300">
              {/* Original Price */}
              <div className="text-sm text-gray-400 line-through">
                {formatPrice(deal.originalPriceUsd)}
              </div>

              {/* Discounted Price */}
              <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">
                {formatPrice(deal.priceUsd)}
              </div>
              <div className="text-xs text-gray-500 mb-3">per seat</div>

              {/* CTA Button */}
              <Button
                className={`w-full ${isSoldOut ? "bg-gray-400" : "bg-[#D4AF37]"} text-black`}
                disabled={isSoldOut}
              >
                {isSoldOut ? "Sold Out" : "View Deal"}
                {!isSoldOut && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  // Filter Section
  const FilterSection = () => (
    <div className="bg-white p-4 border border-gray-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-[#D4AF37]" />
        <span className="font-semibold text-gray-900">Filters & Sort</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </SelectContent>
          </Select>
        </div>

        {/* Discount Filter */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">
            Min Discount
          </Label>
          <Select value={minDiscount} onValueChange={setMinDiscount}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Discount</SelectItem>
              <SelectItem value="10">10%+ Off</SelectItem>
              <SelectItem value="20">20%+ Off</SelectItem>
              <SelectItem value="30">30%+ Off</SelectItem>
              <SelectItem value="50">50%+ Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Sort By</Label>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Earliest)</SelectItem>
              <SelectItem value="cheapest">Cheapest First</SelectItem>
              <SelectItem value="discount">Biggest Discount</SelectItem>
              <SelectItem value="alphabetic">Alphabetic (A-Z)</SelectItem>
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

        <Button onClick={applyFilters} className="bg-[#D4AF37] text-black">
          <Search className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  );

  // Icon mapping for dynamic rendering
  const iconMap: Record<string, React.ReactNode> = {
    DollarSign: (
      <DollarSign className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
    ),
    Clock4: <Clock4 className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />,
    Shield: <Shield className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />,
  };

  // Empty Leg Explanation Sidebar
  const EmptyLegExplanation = () => (
    <div className="p-6 bg-white border border-gray-200 lg:sticky lg:top-24">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {emptyLegsPageData.whatAreEmptyLegs.title}
          </h3>
        </div>

        <div className="space-y-3">
          {emptyLegsPageData.whatAreEmptyLegs.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              {iconMap[benefit.icon]}
              <div>
                <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            {emptyLegsPageData.whatAreEmptyLegs.howItWorks.title}
          </h4>
          <ol className="text-sm text-gray-600 space-y-2">
            {emptyLegsPageData.whatAreEmptyLegs.howItWorks.steps.map(
              (step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-semibold text-[#D4AF37]">
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ),
            )}
          </ol>
        </div>
      </div>
    </div>
  );

  // Initial loading state
  if (loading) {
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
                  <div className="space-y-4 gap-10">
                    {currentDeals.map((deal) => (
                      <TicketCard key={deal.id} deal={deal} />
                    ))}
                  </div>
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
                        setMinDiscount("0");
                        setSortBy("date");
                        setSearchPerformed(false);
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
