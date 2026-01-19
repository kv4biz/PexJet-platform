"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Loader2,
  ImageIcon,
} from "lucide-react";
import {
  Button,
  Badge,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import { aircraftPageData } from "@/data";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  availability: string;
  // Specifications
  passengerCapacityMin: number;
  passengerCapacityMax: number;
  rangeNm: number;
  cruiseSpeedKnots: number;
  baggageCapacityCuFt: number | null;
  fuelCapacityGal: number | null;
  // Interior Dimensions
  cabinLengthFt: number | null;
  cabinWidthFt: number | null;
  cabinHeightFt: number | null;
  // Exterior Dimensions
  lengthFt: number | null;
  wingspanFt: number | null;
  heightFt: number | null;
  // Additional Info
  yearOfManufacture: number | null;
  hourlyRateUsd: number | null;
  description: string | null;
  // Images
  exteriorImages: string[];
  interiorImages: string[];
  thumbnailImage: string | null;
}

export default function AircraftPage() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    try {
      // Only fetch aircraft available for display (local, international, or both)
      const response = await fetch("/api/aircraft?forDisplay=true");
      const data = await response.json();
      setAircraft(data.aircraft || []);
    } catch (error) {
      console.error("Failed to fetch aircraft:", error);
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (aircraft.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % aircraft.length);
    }
  };

  const prev = () => {
    if (aircraft.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + aircraft.length) % aircraft.length);
    }
  };

  const currentAircraft = aircraft[currentIndex];
  const progress =
    aircraft.length > 0 ? ((currentIndex + 1) / aircraft.length) * 100 : 0;

  // Get the primary image (thumbnail, first exterior image, or first interior image)
  const getPrimaryImage = (plane: Aircraft) => {
    if (plane.thumbnailImage) {
      return plane.thumbnailImage;
    }
    if (plane.exteriorImages && plane.exteriorImages.length > 0) {
      return plane.exteriorImages[0];
    }
    if (plane.interiorImages && plane.interiorImages.length > 0) {
      return plane.interiorImages[0];
    }
    return null;
  };

  const formatCategory = (category: string | undefined | null) => {
    if (!category) return "N/A";
    return category.replace(/_/g, " ");
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center py-24 pt-32 overflow-hidden">
        <Image
          src={aircraftPageData.hero.backgroundImage}
          alt={aircraftPageData.hero.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl mb-4 font-serif">
              {aircraftPageData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              {aircraftPageData.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="py-20">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37] mb-4" />
              <p className="text-gray-600">{aircraftPageData.loading.text}</p>
            </div>
          ) : aircraft.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <Plane className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {aircraftPageData.emptyState.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {aircraftPageData.emptyState.description}
              </p>
              <Button asChild>
                <Link href={aircraftPageData.emptyState.cta.href}>
                  {aircraftPageData.emptyState.cta.text}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Carousel Controls and Pagination - Hidden on mobile */}
              <div className="mb-8 hidden md:block">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prev}
                      className="w-12 h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={next}
                      className="w-12 h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="text-[#0C0C0C]">
                    <span className="text-2xl">{currentIndex + 1}</span>
                    <span className="text-gray-400"> of {aircraft.length}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-0.5 bg-gray-200">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-[#D4AF37]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Aircraft Display */}
              {currentAircraft && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Massive Image */}
                  <div className="relative h-[400px] md:h-[600px] overflow-hidden mb-8 bg-gray-100">
                    {getPrimaryImage(currentAircraft) ? (
                      <Image
                        src={getPrimaryImage(currentAircraft)!}
                        alt={currentAircraft.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plane className="h-32 w-32 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Mobile Navigation Arrows - Extreme ends, translucent */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prev}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/5 backdrop-blur-sm border-0 text-white hover:bg-[#D4AF37] transition-all md:hidden"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={next}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/5 backdrop-blur-sm border-0 text-white hover:bg-[#D4AF37] transition-all md:hidden"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>

                    {/* Mobile Pagination Counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/20 text-white px-3 py-1 text-sm md:hidden">
                      {currentIndex + 1} / {aircraft.length}
                    </div>

                    {/* Availability Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {(currentAircraft.availability === "LOCAL" ||
                        currentAircraft.availability === "BOTH") && (
                        <Badge className="bg-[#D4AF37] text-white">
                          {aircraftPageData.badges.local}
                        </Badge>
                      )}
                      {(currentAircraft.availability === "INTERNATIONAL" ||
                        currentAircraft.availability === "BOTH") && (
                        <Badge className="bg-[#0C0C0C] text-white">
                          {aircraftPageData.badges.international}
                        </Badge>
                      )}
                    </div>

                    {/* Category Badge */}
                    <Badge className="absolute top-4 right-4 bg-white/90 text-[#0C0C0C]">
                      {currentAircraft.category || "N/A"}
                    </Badge>
                  </div>

                  {/* Aircraft Name */}
                  <h2 className="text-3xl md:text-4xl text-[#0C0C0C] mb-2 font-serif">
                    {currentAircraft.name}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {currentAircraft.manufacturer} {currentAircraft.model}
                  </p>
                  {currentAircraft.description && (
                    <p className="text-gray-500 mb-6 max-w-3xl">
                      {currentAircraft.description}
                    </p>
                  )}

                  {/* Technical Specifications */}
                  <div className="bg-[#F7F7F7] p-8 border-l-4 border-[#D4AF37]">
                    <h3 className="text-2xl text-[#0C0C0C] mb-6 font-serif">
                      {aircraftPageData.specifications.title}
                    </h3>

                    {/* Basic Information */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-[#0C0C0C] mb-4 border-b border-gray-300 pb-2">
                        Basic Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Aircraft Name
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.name}
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Manufacturer
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.manufacturer}
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Model
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.model}
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Category
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.category || "N/A"}
                          </div>
                        </div>
                        {currentAircraft.yearOfManufacture && (
                          <div className="border-b border-gray-300 pb-4">
                            <div className="text-sm text-gray-500 mb-1">
                              Year of Manufacture
                            </div>
                            <div className="text-[#0C0C0C] font-medium">
                              {currentAircraft.yearOfManufacture}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-[#0C0C0C] mb-4 border-b border-gray-300 pb-2">
                        Performance
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Range
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.rangeNm.toLocaleString()} nm
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Cruise Speed
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.cruiseSpeedKnots.toLocaleString()}{" "}
                            knots
                          </div>
                        </div>
                        {currentAircraft.fuelCapacityGal && (
                          <div className="border-b border-gray-300 pb-4">
                            <div className="text-sm text-gray-500 mb-1">
                              Fuel Capacity
                            </div>
                            <div className="text-[#0C0C0C] font-medium">
                              {currentAircraft.fuelCapacityGal.toLocaleString()}{" "}
                              gal
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cabin Dimensions */}
                    {(currentAircraft.cabinLengthFt ||
                      currentAircraft.cabinWidthFt ||
                      currentAircraft.cabinHeightFt) && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-[#0C0C0C] mb-4 border-b border-gray-300 pb-2">
                          Cabin Dimensions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {currentAircraft.cabinLengthFt && (
                            <div className="border-b border-gray-300 pb-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Cabin Length
                              </div>
                              <div className="text-[#0C0C0C] font-medium">
                                {currentAircraft.cabinLengthFt} ft
                              </div>
                            </div>
                          )}
                          {currentAircraft.cabinWidthFt && (
                            <div className="border-b border-gray-300 pb-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Cabin Width
                              </div>
                              <div className="text-[#0C0C0C] font-medium">
                                {currentAircraft.cabinWidthFt} ft
                              </div>
                            </div>
                          )}
                          {currentAircraft.cabinHeightFt && (
                            <div className="border-b border-gray-300 pb-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Cabin Height
                              </div>
                              <div className="text-[#0C0C0C] font-medium">
                                {currentAircraft.cabinHeightFt} ft
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exterior Dimensions */}
                    {(currentAircraft.lengthFt ||
                      currentAircraft.wingspanFt ||
                      currentAircraft.heightFt) && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-[#0C0C0C] mb-4 border-b border-gray-300 pb-2">
                          Exterior Dimensions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {currentAircraft.lengthFt && (
                            <div className="border-b border-gray-300 pb-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Aircraft Length
                              </div>
                              <div className="text-[#0C0C0C] font-medium">
                                {currentAircraft.lengthFt} ft
                              </div>
                            </div>
                          )}
                          {currentAircraft.wingspanFt && (
                            <div className="border-b border-gray-300 pb-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Wingspan
                              </div>
                              <div className="text-[#0C0C0C] font-medium">
                                {currentAircraft.wingspanFt} ft
                              </div>
                            </div>
                          )}
                          {currentAircraft.heightFt && (
                            <div className="border-b border-gray-300 pb-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Aircraft Height
                              </div>
                              <div className="text-[#0C0C0C] font-medium">
                                {currentAircraft.heightFt} ft
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Capacity */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#0C0C0C] mb-4 border-b border-gray-300 pb-2">
                        Capacity
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Passenger Capacity
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.passengerCapacityMin ===
                            currentAircraft.passengerCapacityMax
                              ? `${currentAircraft.passengerCapacityMax} passengers`
                              : `${currentAircraft.passengerCapacityMin} - ${currentAircraft.passengerCapacityMax} passengers`}
                          </div>
                        </div>
                        {currentAircraft.baggageCapacityCuFt && (
                          <div className="border-b border-gray-300 pb-4">
                            <div className="text-sm text-gray-500 mb-1">
                              Baggage Capacity
                            </div>
                            <div className="text-[#0C0C0C] font-medium">
                              {currentAircraft.baggageCapacityCuFt} cu ft
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Image Gallery Accordion */}
                  <div className="mt-10">
                    <h3 className="text-2xl text-[#0C0C0C] mb-6 font-serif">
                      {aircraftPageData.gallery.title}
                    </h3>

                    {/* Check if any images exist */}
                    {(currentAircraft.exteriorImages &&
                      currentAircraft.exteriorImages.length > 0) ||
                    (currentAircraft.interiorImages &&
                      currentAircraft.interiorImages.length > 0) ? (
                      <Accordion type="multiple" className="w-full">
                        {/* Exterior Images */}
                        <AccordionItem
                          value="exterior"
                          className="border-b border-gray-200 mb-4"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                              <span className="text-lg font-medium text-[#0C0C0C]">
                                {aircraftPageData.gallery.exteriorLabel} (
                                {currentAircraft.exteriorImages?.length || 0})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            {currentAircraft.exteriorImages &&
                            currentAircraft.exteriorImages.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                {currentAircraft.exteriorImages.map(
                                  (img, idx) => (
                                    <div
                                      key={`exterior-${idx}`}
                                      className="relative h-48 lg:h-80 overflow-hidden bg-gray-100 group cursor-pointer"
                                    >
                                      <Image
                                        src={img}
                                        alt={`${currentAircraft.name} exterior ${idx + 1}`}
                                        fill
                                        className="object-cover scale-105 group-hover:scale-100 transition-transform duration-300"
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="py-8 text-center text-gray-500">
                                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>
                                  No exterior images available for this
                                  aircraft.
                                </p>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>

                        {/* Interior Images */}
                        <AccordionItem
                          value="interior"
                          className="border border-gray-200"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                              <span className="text-lg font-medium text-[#0C0C0C]">
                                {aircraftPageData.gallery.interiorLabel} (
                                {currentAircraft.interiorImages?.length || 0})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            {currentAircraft.interiorImages &&
                            currentAircraft.interiorImages.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                {currentAircraft.interiorImages.map(
                                  (img, idx) => (
                                    <div
                                      key={`interior-${idx}`}
                                      className="relative h-48 overflow-hidden bg-gray-100 group cursor-pointer"
                                    >
                                      <Image
                                        src={img}
                                        alt={`${currentAircraft.name} interior ${idx + 1}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="py-8 text-center text-gray-500">
                                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>
                                  No interior images available for this
                                  aircraft.
                                </p>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <div className="py-12 text-center bg-gray-50 border border-gray-200">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg">
                          No images available for this aircraft.
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Check back later for updated gallery.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-10 text-center">
                    <Button
                      asChild
                      size="lg"
                      className="px-10 py-4 bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#D4AF37]/90 transition-all"
                    >
                      <Link href={aircraftPageData.cta.href}>
                        {aircraftPageData.cta.text}
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      <NewsletterCTA />
      <Footer />
    </main>
  );
}
