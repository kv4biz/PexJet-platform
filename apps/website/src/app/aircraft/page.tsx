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
  type: string;
  passengerCapacity: number;
  luggageCapacity: string | null;
  cruiseSpeed: string | null;
  cruiseSpeedKnots: number;
  range: string | null;
  rangeNm: number;
  cabinHeight: string | null;
  cabinWidth: string | null;
  cabinLength: string | null;
  exteriorImages: string[];
  interiorImages: string[];
  availableForLocal: boolean;
  availableForInternational: boolean;
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

  // Get the primary image (first exterior image or thumbnail)
  const getPrimaryImage = (plane: Aircraft) => {
    if (plane.exteriorImages && plane.exteriorImages.length > 0) {
      return plane.exteriorImages[0];
    }
    return null;
  };

  const formatCategory = (category: string) => {
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
              {/* Carousel Controls and Pagination */}
              <div className="mb-8">
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

                    {/* Availability Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {currentAircraft.availableForLocal && (
                        <Badge className="bg-[#D4AF37] text-white">
                          {aircraftPageData.badges.local}
                        </Badge>
                      )}
                      {currentAircraft.availableForInternational && (
                        <Badge className="bg-[#0C0C0C] text-white">
                          {aircraftPageData.badges.international}
                        </Badge>
                      )}
                    </div>

                    {/* Category Badge */}
                    <Badge className="absolute top-4 right-4 bg-white/90 text-[#0C0C0C]">
                      {formatCategory(currentAircraft.type)}
                    </Badge>
                  </div>

                  {/* Aircraft Name */}
                  <h2 className="text-3xl md:text-4xl text-[#0C0C0C] mb-2 font-serif">
                    {currentAircraft.name}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {currentAircraft.manufacturer} {currentAircraft.model}
                  </p>

                  {/* Technical Specifications */}
                  <div className="bg-[#F7F7F7] p-8 border-l-4 border-[#D4AF37]">
                    <h3 className="text-2xl text-[#0C0C0C] mb-6 font-serif">
                      {aircraftPageData.specifications.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="border-b border-gray-300 pb-4">
                        <div className="text-sm text-gray-500 mb-1">
                          {aircraftPageData.specifications.labels.aircraftName}
                        </div>
                        <div className="text-[#0C0C0C] font-medium">
                          {currentAircraft.name}
                        </div>
                      </div>

                      <div className="border-b border-gray-300 pb-4">
                        <div className="text-sm text-gray-500 mb-1">
                          {aircraftPageData.specifications.labels.aircraftType}
                        </div>
                        <div className="text-[#0C0C0C] font-medium">
                          {formatCategory(currentAircraft.type)}
                        </div>
                      </div>

                      <div className="border-b border-gray-300 pb-4">
                        <div className="text-sm text-gray-500 mb-1">
                          {
                            aircraftPageData.specifications.labels
                              .passengerCapacity
                          }
                        </div>
                        <div className="text-[#0C0C0C] font-medium">
                          {currentAircraft.passengerCapacity} passengers
                        </div>
                      </div>

                      {currentAircraft.cabinHeight && (
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {
                              aircraftPageData.specifications.labels
                                .interiorHeight
                            }
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.cabinHeight}
                          </div>
                        </div>
                      )}

                      {currentAircraft.cabinWidth && (
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {
                              aircraftPageData.specifications.labels
                                .interiorWidth
                            }
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.cabinWidth}
                          </div>
                        </div>
                      )}

                      {currentAircraft.cabinLength && (
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {aircraftPageData.specifications.labels.cabinLength}
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.cabinLength}
                          </div>
                        </div>
                      )}

                      {currentAircraft.luggageCapacity && (
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {
                              aircraftPageData.specifications.labels
                                .luggageCapacity
                            }
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.luggageCapacity}
                          </div>
                        </div>
                      )}

                      {currentAircraft.range && (
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {aircraftPageData.specifications.labels.range}
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.range}
                          </div>
                        </div>
                      )}

                      {currentAircraft.cruiseSpeed && (
                        <div className="border-b border-gray-300 pb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {aircraftPageData.specifications.labels.cruiseSpeed}
                          </div>
                          <div className="text-[#0C0C0C] font-medium">
                            {currentAircraft.cruiseSpeed}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Gallery Accordion */}
                  {((currentAircraft.exteriorImages &&
                    currentAircraft.exteriorImages.length > 0) ||
                    (currentAircraft.interiorImages &&
                      currentAircraft.interiorImages.length > 0)) && (
                    <div className="mt-10">
                      <h3 className="text-2xl text-[#0C0C0C] mb-6 font-serif">
                        {aircraftPageData.gallery.title}
                      </h3>
                      <Accordion type="multiple" className="w-full">
                        {/* Exterior Images */}
                        {currentAircraft.exteriorImages &&
                          currentAircraft.exteriorImages.length > 0 && (
                            <AccordionItem
                              value="exterior"
                              className="border-b border-gray-200 mb-4"
                            >
                              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                                  <span className="text-lg font-medium text-[#0C0C0C]">
                                    {aircraftPageData.gallery.exteriorLabel} (
                                    {currentAircraft.exteriorImages.length})
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6">
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
                              </AccordionContent>
                            </AccordionItem>
                          )}

                        {/* Interior Images */}
                        {currentAircraft.interiorImages &&
                          currentAircraft.interiorImages.length > 0 && (
                            <AccordionItem
                              value="interior"
                              className="border border-gray-200"
                            >
                              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                                  <span className="text-lg font-medium text-[#0C0C0C]">
                                    {aircraftPageData.gallery.interiorLabel} (
                                    {currentAircraft.interiorImages.length})
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6">
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
                              </AccordionContent>
                            </AccordionItem>
                          )}
                      </Accordion>
                    </div>
                  )}

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
