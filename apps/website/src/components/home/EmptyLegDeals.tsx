"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plane, Clock, Users } from "lucide-react";
import { homePageData } from "@/data";
import { useCurrency } from "@/context/CurrencyContext";

interface EmptyLegDeal {
  id: string;
  slug: string;
  departureAirport: {
    id: string;
    name: string;
    city: string;
    region: string;
    country: string;
    iataCode: string;
    icaoCode: string;
    latitude: number;
    longitude: number;
  };
  arrivalAirport: {
    id: string;
    name: string;
    city: string;
    region: string;
    country: string;
    iataCode: string;
    icaoCode: string;
    latitude: number;
    longitude: number;
  };
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
  source?: string;
  createdByAdminId?: string;
  createdByOperatorId?: string;
  ownerType: string;
}

// Helper to format time as LT (24-hour format, no timezone conversion)
// For InstaCharter deals, return TBA since they don't provide actual times
function formatTime(dateString: string, source?: string): string {
  // InstaCharter deals don't have actual departure times
  if (source === "INSTACHARTER") return "TBA";
  if (!dateString) return "--";
  try {
    const match = dateString.match(/T?(\d{2}):(\d{2})/);
    if (!match) return "--";
    const [, hours, minutes] = match;
    return `${hours}:${minutes}`; // 24-hour format, no AM/PM
  } catch {
    return "--";
  }
}

// Helper to format date as LT (no timezone conversion)
function formatDate(dateString: string): string {
  if (!dateString) return "--";
  try {
    const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return "--";
    const [, , month, day] = match;
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
    const monthName = months[parseInt(month) - 1];
    return `${monthName} ${parseInt(day)}`;
  } catch {
    return "--";
  }
}

export default function EmptyLegDeals() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState<number>(3);
  const [deals, setDeals] = useState<EmptyLegDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  // Fetch empty legs from database - optimized for homepage
  // Only loads deals within 3 days that have prices, limited to 20
  useEffect(() => {
    async function fetchDeals() {
      try {
        const response = await fetch(
          "/api/empty-legs?status=PUBLISHED&homepage=true",
        );
        if (response.ok) {
          const data = await response.json();
          setDeals(data.emptyLegs || []);
        }
      } catch (error) {
        console.error("Failed to fetch empty legs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  useEffect(() => {
    function getCardsForWidth() {
      if (typeof window === "undefined") return 1;
      const w = window.innerWidth;
      if (w >= 1024) return 2; // 2 cards on large screens
      return 1;
    }

    setCardsToShow(getCardsForWidth());

    const onResize = () => setCardsToShow(getCardsForWidth());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (cardsToShow === 1) {
      const firstChild = el.children[0] as HTMLElement | undefined;
      if (!firstChild) return;
      const childWidth =
        firstChild.getBoundingClientRect().width +
        parseFloat(getComputedStyle(el).gap || "0");
      el.scrollTo({ left: currentIndex * childWidth, behavior: "smooth" });
    }
  }, [currentIndex, cardsToShow]);

  const visibleDeals =
    deals.length > 0
      ? Array.from(
          { length: Math.min(cardsToShow, deals.length) },
          (_, i) => deals[(currentIndex + i) % deals.length],
        )
      : [];

  const next = () => {
    if (deals.length > 0) {
      setCurrentIndex((prev) => (prev + cardsToShow) % deals.length);
    }
  };

  const prev = () => {
    if (deals.length > 0) {
      setCurrentIndex(
        (prev) => (prev - cardsToShow + deals.length) % deals.length,
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl tracking-wider text-[#0C0C0C] mb-4 text-center">
            {homePageData.emptyLegDeals.title}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {homePageData.emptyLegDeals.subtitle}
          </p>
          <div className="flex justify-center">
            <div className="animate-pulse text-gray-500">Loading deals...</div>
          </div>
        </div>
      </section>
    );
  }

  // No deals available
  if (deals.length === 0) {
    return (
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl tracking-wider text-[#0C0C0C] mb-4 text-center">
            {homePageData.emptyLegDeals.title}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {homePageData.emptyLegDeals.subtitle}
          </p>
          <div className="text-center text-gray-500">
            No empty leg deals available at the moment. Check back soon!
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-[#F7F7F7]">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-wider text-[#0C0C0C] mb-3 md:mb-4 text-center">
            {homePageData.emptyLegDeals.title}
          </h2>
          <p className="text-gray-600 text-center mb-4 md:mb-6 max-w-2xl mx-auto text-sm md:text-base px-2">
            {homePageData.emptyLegDeals.subtitle}
          </p>

          {/* Mobile Swipeable Carousel */}
          <div className="md:hidden mb-8">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="shrink-0 w-[85%] snap-center bg-white border border-gray-300 shadow-md overflow-hidden relative flex flex-col"
                >
                  {/* Ticket perforation */}
                  <div className="absolute top-0 left-0 w-full h-full flex justify-between pointer-events-none">
                    <div className="w-1 lg:w-3 h-full border-r-2 border-dashed border-gray-300"></div>
                    <div className="w-1 lg:w-3 h-full border-l-2 border-dashed border-gray-300"></div>
                  </div>

                  <div className="py-8 px-4 flex-grow flex flex-col">
                    {/* Route: From → To */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-[40%] text-left">
                        <div className="text-xs text-gray-500 mb-1">From</div>
                        <div className="font-semibold text-gray-800 text-lg leading-tight">
                          {deal.departureAirport.iataCode ||
                            deal.departureAirport.icaoCode}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {deal.departureAirport.city ||
                            deal.departureAirport.region}
                        </div>
                        <div className="text-xs text-gray-500">
                          {deal.departureAirport.country}
                        </div>
                      </div>
                      <div className="text-[#D4AF37] text-xl px-2 flex-shrink-0 mt-6">
                        →
                      </div>
                      <div className="w-[40%] text-right">
                        <div className="text-xs text-gray-500 mb-1">To</div>
                        <div className="font-semibold text-gray-800 text-lg leading-tight">
                          {deal.arrivalAirport.iataCode ||
                            deal.arrivalAirport.icaoCode}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {deal.arrivalAirport.city ||
                            deal.arrivalAirport.region}
                        </div>
                        <div className="text-xs text-gray-500">
                          {deal.arrivalAirport.country}
                        </div>
                      </div>
                    </div>
                    {/* Header: Aircraft & Date */}
                    <div className="flex justify-end lg:justify-between items-center mb-1 lg:mb-4 flex-grow">
                      <div className="items-center gap-1 hidden lg:flex">
                        <Plane className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-500 text-sm">
                          {deal.aircraft.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatDate(deal.departureDate)}{" "}
                            {formatTime(deal.departureDate, deal.source)}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{deal.availableSeats}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="pt-2 mt-auto border-t border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-lg lg:text-xl font-semibold capitalize text-[#D4AF37]">
                          {deal.priceUsd
                            ? formatPrice(deal.priceUsd)
                            : deal.priceText}
                        </div>
                      </div>
                      <Link
                        href={`/empty-legs/${deal.slug}`}
                        className="bg-[#D4AF37] text-white px-4 py-1 font-medium hover:bg-[#B8962E] transition-colors"
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              Swipe to see more deals
            </p>
          </div>

          {/* Desktop/Tablet Carousel - 2 on medium, 3 on large */}
          <div className="hidden md:block mb-8">
            <div className="flex gap-4 lg:gap-6">
              {visibleDeals.map((deal, index) => (
                <motion.div
                  key={`${deal.id}-${currentIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-1 min-w-0 bg-white border border-gray-300 shadow-md overflow-hidden relative group flex flex-col"
                >
                  {/* Ticket perforation */}
                  <div className="absolute top-0 left-0 w-full h-full flex justify-between pointer-events-none">
                    <div className="w-4 h-full border-r-2 border-dashed border-gray-300"></div>
                    <div className="w-4 h-full border-l-2 border-dashed border-gray-300"></div>
                  </div>

                  <div className="p-4 md:p-6 flex-grow flex flex-col">
                    {/* Route: From → To */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-[42%] text-left">
                        <div className="text-xs text-gray-500">From</div>
                        <div className="font-semibold text-gray-800 text-lg">
                          {deal.departureAirport.iataCode ||
                            deal.departureAirport.icaoCode}
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {deal.departureAirport.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {deal.departureAirport.city ||
                            deal.departureAirport.region}
                          , {deal.departureAirport.country}
                        </div>
                      </div>
                      <div className="text-[#D4AF37] text-xl px-2 flex-shrink-0">
                        →
                      </div>
                      <div className="w-[42%] text-right">
                        <div className="text-xs text-gray-500">To</div>
                        <div className="font-semibold text-gray-800 text-lg">
                          {deal.arrivalAirport.iataCode ||
                            deal.arrivalAirport.icaoCode}
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {deal.arrivalAirport.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {deal.arrivalAirport.city ||
                            deal.arrivalAirport.region}
                          , {deal.arrivalAirport.country}
                        </div>
                      </div>
                    </div>
                    {/* Header: Aircraft & Date */}
                    <div className="flex justify-between items-center mb-1 lg:mb-4 flex-grow">
                      <div className="flex items-center gap-1">
                        <Plane className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-500 text-sm">
                          {deal.aircraft.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatDate(deal.departureDate)}{" "}
                            {formatTime(deal.departureDate, deal.source)}
                            {deal.source !== "INSTACHARTER" ? " LT" : ""}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{deal.availableSeats}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="pt-2 mt-auto border-t border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold capitalize text-[#D4AF37]">
                          {deal.priceUsd
                            ? formatPrice(deal.priceUsd)
                            : deal.priceText}
                        </div>
                      </div>
                      <Link
                        href={`/empty-legs/${deal.slug}`}
                        className="bg-[#D4AF37] text-white px-4 py-1 font-semibold hover:bg-[#B8962E] transition-colors"
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons - Desktop/Tablet only */}
          {deals.length > cardsToShow && (
            <div className="hidden md:flex justify-center gap-4 lg:gap-8">
              <button
                onClick={prev}
                className="w-10 h-10 md:w-12 md:h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 md:w-12 md:h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
