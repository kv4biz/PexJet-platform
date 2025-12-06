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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@pexjet/ui";
import {
  Check,
  Users,
  Package,
  Clock,
  ArrowRight,
  Gauge,
  Eye,
  Loader2,
} from "lucide-react";
import { charterPageData } from "@/data";

interface Aircraft {
  id: string;
  name: string;
  model: string | null;
  type: string;
  manufacturer: string | null;
  passengerCapacity: number;
  luggageCapacity: string | null;
  cruiseSpeed: string | null;
  cruiseSpeedKnots: number;
  range: string | null;
  rangeNm: number;
  cabinHeight: string | null;
  cabinWidth: string | null;
  cabinLength: string | null;
  hourlyRateUsd: number;
  exteriorImages: string[];
  interiorImages: string[];
  availableForLocal: boolean;
  availableForInternational: boolean;
}

interface AircraftSelectionProps {
  formData: any;
  onNext: (data: any) => void;
}

export function AircraftSelection({
  formData,
  onNext,
}: AircraftSelectionProps) {
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string>("local");
  const [localAircraft, setLocalAircraft] = useState<Aircraft[]>([]);
  const [internationalAircraft, setInternationalAircraft] = useState<
    Aircraft[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Separate aircraft by availability
        const local =
          data.aircraft?.filter((a: Aircraft) => a.availableForLocal) || [];
        const international =
          data.aircraft?.filter((a: Aircraft) => a.availableForInternational) ||
          [];

        setLocalAircraft(local);
        setInternationalAircraft(international);
      } catch (err: any) {
        console.error("Error fetching aircraft:", err);
        setError(err.message || "Failed to load aircraft");
      } finally {
        setLoading(false);
      }
    };

    fetchAircraft();
  }, []);

  const handleSelectAircraft = (aircraftId: string) => {
    setSelectedAircraft((prev) => {
      if (prev.includes(aircraftId)) {
        return prev.filter((id) => id !== aircraftId);
      } else if (prev.length < 5) {
        return [...prev, aircraftId];
      }
      return prev;
    });
  };

  const getSelectedAircraftDetails = () => {
    const allAircraft = [...localAircraft, ...internationalAircraft];
    return selectedAircraft
      .map((id) => allAircraft.find((a) => a.id === id))
      .filter((a): a is Aircraft => Boolean(a));
  };

  const handleContinue = () => {
    if (selectedAircraft.length > 0) {
      const selected = getSelectedAircraftDetails();
      onNext({ selectedAircraft: selected });
    }
  };

  const AircraftRow = ({
    aircraft,
    isSelected,
  }: {
    aircraft: Aircraft;
    isSelected: boolean;
  }) => (
    <div
      className={`grid grid-cols-6 lg:grid-cols-10 gap-2 p-2 border-b border-gray-200 cursor-pointer transition-all ${
        isSelected
          ? "bg-[#D4AF37]/5 border-l-4 border-l-[#D4AF37]"
          : "hover:bg-gray-50"
      }`}
      onClick={() => handleSelectAircraft(aircraft.id)}
    >
      {/* Aircraft Name & Selection */}
      <div className="col-span-4 lg:col-span-3 flex items-center gap-3">
        <div
          className={`w-3 h-3 border flex items-center justify-center ${
            isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{aircraft.name}</div>
          <div className="text-xs text-gray-500">
            {aircraft.model || aircraft.type}
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="col-span-1 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <span>{aircraft.passengerCapacity}</span>
      </div>

      {/* Luggage */}
      <div className="col-span-1 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Package className="w-4 h-4" />
        <span>{aircraft.luggageCapacity || "-"}</span>
      </div>

      {/* Speed */}
      <div className="col-span-2 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Gauge className="w-4 h-4" />
        <span>{aircraft.cruiseSpeed || "-"}</span>
      </div>

      {/* Type */}
      <div className="col-span-1 flex items-center gap-1 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span className="truncate">{aircraft.type}</span>
      </div>

      {/* Image Preview */}
      <div className="col-span-1 flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="w-64 p-0">
              {aircraft.exteriorImages?.[0] ? (
                <img
                  src={aircraft.exteriorImages[0]}
                  alt={aircraft.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  No image available
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  const TableHeader = () => (
    <div className="grid grid-cols-6 lg:grid-cols-10 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
      <div className="col-span-4 lg:col-span-3">Aircraft</div>
      <div className="col-span-1 hidden lg:block">Seats</div>
      <div className="col-span-1 hidden lg:block">Luggage</div>
      <div className="col-span-2 hidden lg:block">Speed</div>
      <div className="col-span-1">Type</div>
      <div className="col-span-1 text-right">View</div>
    </div>
  );

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
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const formContent = charterPageData.form.aircraftSelection;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {formContent.title}
        </h2>
        <p className="text-gray-600">{formContent.subtitle}</p>
        <div className="mt-2 text-sm text-gray-500">
          Selected: {selectedAircraft.length}/{formContent.maxSelection}{" "}
          aircraft
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openAccordion}
        onValueChange={setOpenAccordion}
        className="space-y-4"
      >
        {/* Local Jets Accordion */}
        <AccordionItem
          value="local"
          className="border border-gray-200 overflow-hidden"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <p className="font-semibold text-lg">
                {formContent.categories.local.title}
              </p>
              <p className="text-sm hidden lg:block text-gray-500">
                {formContent.categories.local.description}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="bg-white">
              <TableHeader />
              <div className="max-h-96 overflow-y-auto">
                {localAircraft.length > 0 ? (
                  localAircraft.map((aircraft) => (
                    <AircraftRow
                      key={aircraft.id}
                      aircraft={aircraft}
                      isSelected={selectedAircraft.includes(aircraft.id)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No local aircraft available
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* International Jets Accordion */}
        <AccordionItem
          value="international"
          className="border border-gray-200 overflow-hidden"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <p className="font-semibold text-lg">
                {formContent.categories.international.title}
              </p>
              <p className="text-sm hidden lg:block text-gray-500">
                {formContent.categories.international.description}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="bg-white">
              <TableHeader />
              <div className="max-h-96 overflow-y-auto">
                {internationalAircraft.length > 0 ? (
                  internationalAircraft.map((aircraft) => (
                    <AircraftRow
                      key={aircraft.id}
                      aircraft={aircraft}
                      isSelected={selectedAircraft.includes(aircraft.id)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No international aircraft available
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Selected Aircraft Preview */}
      {selectedAircraft.length > 0 && (
        <Card className="p-4 border-[#D4AF37]/20 bg-[#D4AF37]/5">
          <h4 className="font-semibold text-gray-900 lg:mb-3">
            Selected Aircraft ({selectedAircraft.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {getSelectedAircraftDetails().map((aircraft) => (
              <div
                key={aircraft.id}
                className="flex items-center gap-2 p-1 lg:px-3 lg:py-2 border border-[#D4AF37]"
              >
                <span className="text-sm">{aircraft.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAircraft(aircraft.id);
                  }}
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
          disabled={selectedAircraft.length === 0}
          className="bg-[#D4AF37]"
        >
          Continue ({selectedAircraft.length} selected)
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
