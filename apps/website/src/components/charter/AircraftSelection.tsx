// components/charter/AircraftSelection.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@pexjet/ui";
import {
  Check,
  Users,
  Package,
  ArrowRight,
  Gauge,
  Eye,
  Loader2,
  DollarSign,
  X,
  Plane,
  Clock4,
} from "lucide-react";
import { charterPageData } from "@/data";

// Utility functions copied to avoid import issues
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function estimateFlightDuration(
  distanceNm: number,
  cruiseSpeedKnots: number = 450,
): number {
  // Add 30 minutes for takeoff and landing
  const flightTimeMinutes = (distanceNm / cruiseSpeedKnots) * 60;
  return Math.round(flightTimeMinutes + 30);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Category specifications
const CATEGORIES = {
  LIGHT: {
    name: "Light",
    pricePerHour: 4000,
    cruiseSpeed: 450,
    minPassengers: 1,
    maxPassengers: 8,
  },
  MIDSIZE: {
    name: "Midsize",
    pricePerHour: 4500,
    cruiseSpeed: 470,
    minPassengers: 1,
    maxPassengers: 10,
  },
  SUPER_MIDSIZE: {
    name: "Super Midsize",
    pricePerHour: 6500,
    cruiseSpeed: 490,
    minPassengers: 2,
    maxPassengers: 12,
  },
  ULTRA_LONG_RANGE: {
    name: "Ultra Long Range",
    pricePerHour: 6500,
    cruiseSpeed: 510,
    minPassengers: 3,
    maxPassengers: 20,
  },
  HEAVY: {
    name: "Heavy",
    pricePerHour: 6500,
    cruiseSpeed: 530,
    minPassengers: 3,
    maxPassengers: 20,
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  availability: string;
  basePricePerHour: number | null;
  exteriorImages: string[];
  interiorImages: string[];
  // ... other fields
}

interface AircraftSelectionProps {
  formData: any;
  onNext: (data: any) => void;
}

export function AircraftSelection({
  formData,
  onNext,
}: AircraftSelectionProps) {
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(
    [],
  );
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingAircraft, setViewingAircraft] = useState<Aircraft | null>(null);
  const [flightDistance, setFlightDistance] = useState<number | null>(null);
  const [currentAircraftIndex, setCurrentAircraftIndex] = useState<
    Record<CategoryKey, number>
  >({} as Record<CategoryKey, number>);

  // Fetch aircraft from database
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/aircraft");
        if (!response.ok) {
          throw new Error("Failed to fetch aircraft");
        }
        const data = await response.json();
        setAircraft(data.aircraft || []);
      } catch (err: any) {
        console.error("Error fetching aircraft:", err);
        setError(err.message || "Failed to load aircraft");
      } finally {
        setLoading(false);
      }
    };

    fetchAircraft();
  }, []);

  // Calculate flight distance when route data changes
  useEffect(() => {
    const calculateRouteDistance = async () => {
      if (!formData?.flights || formData.flights.length === 0) {
        console.log(
          "AircraftSelection: No flights data found in formData",
          formData,
        );
        setFlightDistance(null);
        return;
      }

      try {
        const flights = formData.flights;
        let totalDistanceNm = 0;

        console.log(
          "AircraftSelection: Calculating distance for flights:",
          flights,
        );

        // Extract airport info and fetch coordinates
        for (const flight of flights) {
          if (flight.from && flight.to) {
            // Format is "CODE - Name" (e.g., "LOS - Lagos") or just the airport string
            const fromParts = flight.from.split(" - ");
            const toParts = flight.to.split(" - ");
            const fromCode = fromParts[0]?.trim();
            const toCode = toParts[0]?.trim();
            const fromName = fromParts[1]?.trim() || fromParts[0]?.trim();
            const toName = toParts[1]?.trim() || toParts[0]?.trim();

            console.log("AircraftSelection: Looking up airports:", {
              fromCode,
              toCode,
              fromName,
              toName,
            });

            if (fromName && toName) {
              try {
                // Fetch airport coordinates using name for better matching
                const [fromRes, toRes] = await Promise.all([
                  fetch(
                    `/api/airports?q=${encodeURIComponent(fromName)}&limit=10`,
                  ),
                  fetch(
                    `/api/airports?q=${encodeURIComponent(toName)}&limit=10`,
                  ),
                ]);

                const fromData = await fromRes.json();
                const toData = await toRes.json();

                // Find exact match by IATA/ICAO code first, then by name
                const fromAirport =
                  fromData.airports?.find(
                    (a: any) =>
                      a.iataCode === fromCode || a.icaoCode === fromCode,
                  ) ||
                  fromData.airports?.find(
                    (a: any) =>
                      a.municipality?.toLowerCase() ===
                        fromName.toLowerCase() ||
                      a.name?.toLowerCase().includes(fromName.toLowerCase()),
                  ) ||
                  fromData.airports?.[0];

                const toAirport =
                  toData.airports?.find(
                    (a: any) => a.iataCode === toCode || a.icaoCode === toCode,
                  ) ||
                  toData.airports?.find(
                    (a: any) =>
                      a.municipality?.toLowerCase() === toName.toLowerCase() ||
                      a.name?.toLowerCase().includes(toName.toLowerCase()),
                  ) ||
                  toData.airports?.[0];

                console.log("AircraftSelection: Found airports:", {
                  from: fromAirport
                    ? {
                        name: fromAirport.name,
                        lat: fromAirport.latitude,
                        lng: fromAirport.longitude,
                      }
                    : null,
                  to: toAirport
                    ? {
                        name: toAirport.name,
                        lat: toAirport.latitude,
                        lng: toAirport.longitude,
                      }
                    : null,
                });

                if (
                  fromAirport?.latitude &&
                  fromAirport?.longitude &&
                  toAirport?.latitude &&
                  toAirport?.longitude
                ) {
                  const distance = calculateDistance(
                    fromAirport.latitude,
                    fromAirport.longitude,
                    toAirport.latitude,
                    toAirport.longitude,
                  );
                  console.log(
                    "AircraftSelection: Calculated distance:",
                    distance,
                    "nm",
                  );
                  totalDistanceNm += distance;
                }
              } catch (err) {
                console.error("Error fetching airport coordinates:", err);
              }
            }
          }
        }

        // For round trip, double the distance
        if (formData.tripType === "roundTrip") {
          totalDistanceNm *= 2;
        }

        setFlightDistance(
          totalDistanceNm > 0 ? Math.round(totalDistanceNm) : null,
        );
      } catch (error) {
        console.error("Error calculating flight distance:", error);
        setFlightDistance(null);
      }
    };

    calculateRouteDistance();
  }, [formData?.flights, formData?.tripType]);

  // Initialize carousel indices
  useEffect(() => {
    const indices: Record<CategoryKey, number> = {} as Record<
      CategoryKey,
      number
    >;
    Object.keys(CATEGORIES).forEach((key) => {
      indices[key as CategoryKey] = 0;
    });
    setCurrentAircraftIndex(indices);
  }, []);

  // Carousel rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAircraftIndex((prev) => {
        const newIndices = { ...prev };
        Object.keys(CATEGORIES).forEach((key) => {
          const categoryKey = key as CategoryKey;
          const categoryAircraft = aircraft.filter(
            (a) => a.category === categoryKey,
          );
          if (categoryAircraft.length > 0) {
            newIndices[categoryKey] =
              (prev[categoryKey] + 1) % categoryAircraft.length;
          }
        });
        return newIndices;
      });
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(interval);
  }, [aircraft]);

  // Get available categories based on passenger count
  const getAvailableCategories = () => {
    const passengerCount = formData?.passengers || 1;
    return Object.entries(CATEGORIES).filter(
      ([_, category]) =>
        passengerCount >= category.minPassengers &&
        passengerCount <= category.maxPassengers,
    ) as [CategoryKey, (typeof CATEGORIES)[CategoryKey]][];
  };

  // Get aircraft for category carousel
  const getAircraftForCategory = (categoryKey: CategoryKey) => {
    return aircraft.filter((a) => a.category === categoryKey);
  };

  // Get current aircraft for display
  const getCurrentAircraft = (categoryKey: CategoryKey) => {
    const categoryAircraft = getAircraftForCategory(categoryKey);
    if (categoryAircraft.length === 0) return null;
    return categoryAircraft[currentAircraftIndex[categoryKey] || 0];
  };

  const handleSelectCategory = (categoryKey: CategoryKey) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryKey)) {
        return prev.filter((key) => key !== categoryKey);
      } else if (prev.length < 5) {
        return [...prev, categoryKey];
      }
      return prev;
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length > 0) {
      const selectedCategoryData = selectedCategories.map((key) => ({
        category: key,
        ...CATEGORIES[key],
        aircraft: getAircraftForCategory(key),
      }));
      onNext({ selectedCategories: selectedCategoryData });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <p className="text-gray-600">Loading available aircraft...</p>
      </div>
    );
  }

  const availableCategories = getAvailableCategories();

  return (
    <div className="space-y-6" id="aircraft-selection-container">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Aircraft Category
        </h2>
        <p className="text-gray-600">Choose the perfect jet for your journey</p>
        <div className="mt-2 text-sm text-gray-500">
          Selected: {selectedCategories.length}/5 categories
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-6" id="aircraft-categories-list">
        {availableCategories.length > 0 ? (
          availableCategories.map(([categoryKey, category]) => {
            const isSelected = selectedCategories.includes(categoryKey);
            const currentAircraft = getCurrentAircraft(categoryKey);

            // Calculate flight duration for this category
            const calculateFlightDuration = () => {
              if (!flightDistance || flightDistance === 0) {
                return "Calculating...";
              }
              const durationMinutes = estimateFlightDuration(
                flightDistance,
                category.cruiseSpeed,
              );
              return formatDuration(durationMinutes);
            };

            // Calculate price for this category
            const calculateEstimatedPrice = () => {
              if (!flightDistance || flightDistance === 0) {
                return 0;
              }
              const durationMinutes = estimateFlightDuration(
                flightDistance,
                category.cruiseSpeed,
              );
              const hours = durationMinutes / 60;
              const rawPrice = category.pricePerHour * hours;
              return Math.ceil(rawPrice / 100) * 100; // Always round up to nearest 100
            };

            return (
              <div
                key={categoryKey}
                className={`relative ${
                  isSelected
                    ? "ring-2 ring-[#D4AF37] bg-[#D4AF37]/5"
                    : "border border-gray-200"
                } rounded-lg overflow-hidden bg-white`}
              >
                {/* Top Half - Image with Overlay Text */}
                <div className="relative h-48 bg-gray-100">
                  {currentAircraft?.exteriorImages?.[0] ? (
                    <img
                      src={currentAircraft.exteriorImages[0]}
                      alt={currentAircraft.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Plane className="w-16 h-16" />
                    </div>
                  )}

                  {/* Category Type - Top Left */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded text-sm font-semibold">
                    {category.name}
                  </div>

                  {/* Aircraft Name - Bottom Left */}
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded">
                    <div className="font-semibold">
                      {currentAircraft?.name || category.name}
                    </div>
                  </div>
                </div>

                {/* Bottom Half - Details */}
                <div className="p-4 space-y-3">
                  {/* First Row - Passengers & Flight Duration */}
                  <div className="flex items-start justify-between">
                    {/* Passengers - Stacked Layout */}
                    <div className="flex items-center justify-center gap-1">
                      <div className="bg-gray-100 p-2 rounded-xl">
                        <Users className="w-4 h-4 text-gray-400 my-1" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          Up to
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {category.maxPassengers} passengers
                        </span>
                      </div>
                    </div>

                    {/* Flight Duration - Stacked Layout */}
                    <div className="flex items-center justify-center gap-1">
                      <div className="bg-gray-100 p-2 rounded-xl">
                        <Clock4 className="w-4 h-4 text-gray-400 my-1" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          Flight
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {calculateFlightDuration()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Second Row - Price & Button */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Starting from</div>
                      <div className="text-xl font-bold text-[#D4AF37]">
                        {calculateEstimatedPrice() > 0
                          ? `USD ${calculateEstimatedPrice().toLocaleString()}`
                          : "Calculating..."}
                      </div>
                      <div className="text-xs text-gray-500">
                        Estimated price excluding taxes and fees
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectCategory(categoryKey);
                      }}
                      type="button"
                      className={`w-full py-2 px-4 text-sm font-medium ${
                        isSelected
                          ? "bg-gray-500 text-white"
                          : "bg-[#D4AF37] text-black"
                      }`}
                    >
                      {isSelected ? "Selected Category" : "Add to Quote"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            {formData?.passengers
              ? `No aircraft categories available for ${formData.passengers} passengers`
              : "No aircraft categories available"}
          </div>
        )}
      </div>

      {/* Selected Categories Preview */}
      {selectedCategories.length > 0 && (
        <Card className="p-4 border-[#D4AF37]/20 bg-[#D4AF37]/5">
          <h4 className="font-semibold text-gray-900 mb-3">
            SELECTED CATEGORIES:
          </h4>
          <div className="space-y-2">
            {selectedCategories.map((categoryKey, index) => {
              const category = CATEGORIES[categoryKey];
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 px-3 py-2 border border-[#D4AF37] bg-white"
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectCategory(categoryKey);
                    }}
                    type="button"
                    className="text-gray-400 hover:text-red-500 text-lg"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleContinue}
          variant="outline"
          disabled={selectedCategories.length === 0}
          className="bg-[#D4AF37]"
        >
          Continue ({selectedCategories.length} selected)
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
