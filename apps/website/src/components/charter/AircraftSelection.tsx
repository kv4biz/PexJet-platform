// components/charter/AircraftSelection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button, Card } from "@pexjet/ui";
import { Users, ArrowRight, Loader2, Plane, Clock4 } from "lucide-react";

// InstaCharter category data structure
interface InstaCharterJet {
  id: number;
  name: string;
  image: string;
  priceCategory: string;
  searchCategory: string;
}

interface InstaCharterCategory {
  categoryId: number;
  category: string;
  originalCategory: string;
  price: number;
  priceFormatted: string;
  currency: string;
  currencySymbol: string;
  maxPassengers: number;
  range: number;
  flightTime: string;
  flightTimeFormatted: string;
  distanceFromStart: number;
  distanceFromEnd: number;
  jets: InstaCharterJet[];
}

interface AircraftSelectionProps {
  formData: any;
  onNext: (data: any) => void;
}

export function AircraftSelection({
  formData,
  onNext,
}: AircraftSelectionProps) {
  const [selectedCategories, setSelectedCategories] = useState<
    InstaCharterCategory[]
  >([]);
  const [categories, setCategories] = useState<InstaCharterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentJetIndex, setCurrentJetIndex] = useState<
    Record<number, number>
  >({});
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch charter options from InstaCharter API
  useEffect(() => {
    const fetchCharterOptions = async () => {
      // Prevent duplicate fetches
      if (hasFetched) return;

      console.log("AircraftSelection: formData received:", formData);

      if (!formData?.flights || formData.flights.length === 0) {
        console.log(
          "AircraftSelection: No flights data found in formData",
          formData,
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setHasFetched(true);

        const flight = formData.flights[0];
        console.log("AircraftSelection: Processing flight:", flight);

        if (!flight?.from || !flight?.to) {
          setError("Missing departure or arrival information");
          setLoading(false);
          return;
        }

        // Parse airport info from the format "CODE - Region - Name, Country"
        const fromParts = flight.from.split(" - ");
        const toParts = flight.to.split(" - ");
        const fromCode = fromParts[0]?.trim();
        const toCode = toParts[0]?.trim();
        // Extract airport name (last part before country)
        const fromAirportName =
          fromParts[2]?.split(",")[0]?.trim() || fromParts[1]?.trim();
        const toAirportName =
          toParts[2]?.split(",")[0]?.trim() || toParts[1]?.trim();

        console.log("AircraftSelection: Parsed info:", {
          fromCode,
          toCode,
          fromAirportName,
          toAirportName,
        });

        // Fetch airport coordinates - search by airport name for better accuracy
        const [fromRes, toRes] = await Promise.all([
          fetch(
            `/api/airports?q=${encodeURIComponent(fromAirportName || fromCode)}&limit=10`,
          ),
          fetch(
            `/api/airports?q=${encodeURIComponent(toAirportName || toCode)}&limit=10`,
          ),
        ]);

        const fromData = await fromRes.json();
        const toData = await toRes.json();

        console.log("AircraftSelection: Airport search results:", {
          fromResults: fromData.airports?.map((a: any) => ({
            name: a.name,
            iata: a.iataCode,
          })),
          toResults: toData.airports?.map((a: any) => ({
            name: a.name,
            iata: a.iataCode,
          })),
        });

        // Find exact match by IATA/ICAO code first
        const fromAirport =
          fromData.airports?.find(
            (a: any) => a.iataCode === fromCode || a.icaoCode === fromCode,
          ) || fromData.airports?.[0];

        const toAirport =
          toData.airports?.find(
            (a: any) => a.iataCode === toCode || a.icaoCode === toCode,
          ) || toData.airports?.[0];

        if (!fromAirport || !toAirport) {
          setError("Could not find airport coordinates");
          setLoading(false);
          return;
        }

        console.log("AircraftSelection: Fetching InstaCharter options for:", {
          from: {
            name: fromAirport.name,
            lat: fromAirport.latitude,
            long: fromAirport.longitude,
          },
          to: {
            name: toAirport.name,
            lat: toAirport.latitude,
            long: toAirport.longitude,
          },
        });

        // Call our InstaCharter options API
        const response = await fetch("/api/charter/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: {
              lat: fromAirport.latitude,
              long: fromAirport.longitude,
              name: fromAirport.name,
            },
            to: {
              lat: toAirport.latitude,
              long: toAirport.longitude,
              name: toAirport.name,
            },
            date: flight.date || new Date().toISOString().split("T")[0],
            pax: formData.passengers || 1,
            tripType: formData.tripType || "oneWay",
            flights: formData.flights,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch charter options");
        }

        const data = await response.json();
        console.log("AircraftSelection: Received InstaCharter data:", data);

        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          // Initialize jet carousel indices
          const indices: Record<number, number> = {};
          data.categories.forEach((cat: InstaCharterCategory) => {
            indices[cat.categoryId] = 0;
          });
          setCurrentJetIndex(indices);
        } else {
          setError("No aircraft categories available for this route");
        }
      } catch (err: any) {
        console.error("Error fetching charter options:", err);
        setError(err.message || "Failed to load aircraft options");
      } finally {
        setLoading(false);
      }
    };

    fetchCharterOptions();
  }, [formData?.flights, formData?.passengers]);

  // Jet carousel rotation effect
  useEffect(() => {
    if (categories.length === 0) return;

    const interval = setInterval(() => {
      setCurrentJetIndex((prev) => {
        const newIndices = { ...prev };
        categories.forEach((cat) => {
          if (cat.jets && cat.jets.length > 0) {
            newIndices[cat.categoryId] =
              ((prev[cat.categoryId] || 0) + 1) % cat.jets.length;
          }
        });
        return newIndices;
      });
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [categories]);

  // Get current jet for display
  const getCurrentJet = (category: InstaCharterCategory) => {
    if (!category.jets || category.jets.length === 0) return null;
    return category.jets[currentJetIndex[category.categoryId] || 0];
  };

  const handleSelectCategory = (category: InstaCharterCategory) => {
    setSelectedCategories((prev) => {
      const isAlreadySelected = prev.some(
        (c) => c.categoryId === category.categoryId,
      );
      if (isAlreadySelected) {
        return prev.filter((c) => c.categoryId !== category.categoryId);
      } else if (prev.length < 5) {
        return [...prev, category];
      }
      return prev;
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length > 0) {
      onNext({ selectedCategories });
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

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
        {categories.length > 0 ? (
          categories.map((category) => {
            const isSelected = selectedCategories.some(
              (c) => c.categoryId === category.categoryId,
            );
            const currentJet = getCurrentJet(category);

            return (
              <div
                key={category.categoryId}
                className={`relative ${
                  isSelected
                    ? "ring-2 ring-[#D4AF37] bg-[#D4AF37]/5"
                    : "border border-gray-200"
                } rounded-lg overflow-hidden bg-white`}
              >
                {/* Top Half - Image with Overlay Text */}
                <div className="relative h-48 bg-gray-100">
                  {currentJet?.image ? (
                    <img
                      src={currentJet.image}
                      alt={currentJet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Plane className="w-16 h-16" />
                    </div>
                  )}

                  {/* Category Type - Top Left */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded text-sm font-semibold">
                    {category.category}
                  </div>

                  {/* Aircraft Name - Bottom Left */}
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded">
                    <div className="font-semibold">
                      {currentJet?.name || category.category}
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
                          Flight Duration
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {category.flightTimeFormatted ||
                            category.flightTime ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Second Row - Price & Button */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Starting from</div>
                      <div className="text-xl font-bold text-[#D4AF37]">
                        {category.priceFormatted}
                      </div>
                      <div className="text-xs text-gray-500">
                        Estimated price excluding taxes and fees
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectCategory(category);
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
            No aircraft categories available for this route
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
            {selectedCategories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 px-3 py-2 border border-[#D4AF37] bg-white"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {category.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {category.priceFormatted}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectCategory(category);
                  }}
                  type="button"
                  className="text-gray-400 hover:text-red-500 text-lg"
                >
                  ×
                </button>
              </div>
            ))}
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
