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
  const [viewingAircraft, setViewingAircraft] = useState<Aircraft | null>(null);

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
      className={`grid grid-cols-10 lg:grid-cols-12 gap-2 p-2 border-b border-gray-200 cursor-pointer transition-all ${
        isSelected
          ? "bg-[#D4AF37]/5 border-l-4 border-l-[#D4AF37]"
          : "hover:bg-gray-50"
      }`}
      onClick={() => handleSelectAircraft(aircraft.id)}
    >
      {/* Aircraft Name & Type */}
      <div className="col-span-5 lg:col-span-3 flex items-center gap-3">
        <div
          className={`w-3 h-3 border flex items-center justify-center shrink-0 ${
            isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {aircraft.name}
          </div>
          <div className="text-xs text-gray-500 truncate">{aircraft.type}</div>
        </div>
      </div>

      {/* Seats (min) - visible on all screens */}
      <div className="col-span-2 flex items-center gap-1 text-sm text-gray-600">
        <Users className="w-4 h-4 shrink-0" />
        <span>{aircraft.passengerCapacity}</span>
      </div>

      {/* Luggage */}
      <div className="col-span-2 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Package className="w-4 h-4 shrink-0" />
        <span className="truncate">{aircraft.luggageCapacity || "-"}</span>
      </div>

      {/* Speed */}
      <div className="col-span-2 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Gauge className="w-4 h-4 shrink-0" />
        <span className="truncate">{aircraft.cruiseSpeed || "-"}</span>
      </div>

      {/* Hourly Rate USD */}
      <div className="col-span-2 flex items-center gap-1 text-sm text-gray-600">
        <DollarSign className="w-4 h-4 shrink-0" />
        <span className="truncate">
          {aircraft.hourlyRateUsd
            ? `${aircraft.hourlyRateUsd.toLocaleString()}`
            : "-"}
        </span>
      </div>

      {/* View Button */}
      <div className="col-span-1 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewingAircraft(aircraft);
          }}
          className="p-1 text-gray-400 hover:text-[#D4AF37] transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const TableHeader = () => (
    <div className="grid grid-cols-10 lg:grid-cols-12 gap-2 p-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
      <div className="col-span-5 lg:col-span-3">Aircraft</div>
      <div className="col-span-2">Seats</div>
      <div className="col-span-2 hidden lg:block">Luggage</div>
      <div className="col-span-2 hidden lg:block">Speed</div>
      <div className="col-span-2">Rate/hr</div>
      <div className="col-span-1 text-right j">View</div>
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

      {/* Aircraft Detail Dialog */}
      <Dialog
        open={!!viewingAircraft}
        onOpenChange={() => setViewingAircraft(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingAircraft && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {viewingAircraft.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">{viewingAircraft.type}</p>
              </DialogHeader>

              {/* Thumbnail Image */}
              <div className="mt-4">
                {viewingAircraft.exteriorImages?.[0] ? (
                  <img
                    src={viewingAircraft.exteriorImages[0]}
                    alt={viewingAircraft.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {viewingAircraft.manufacturer &&
                    `${viewingAircraft.manufacturer} `}
                  {viewingAircraft.model || viewingAircraft.name} - A{" "}
                  {viewingAircraft.type.toLowerCase()}
                  with seating for up to {
                    viewingAircraft.passengerCapacity
                  }{" "}
                  passengers.
                  {viewingAircraft.rangeNm > 0 &&
                    ` Range: ${viewingAircraft.range || `${viewingAircraft.rangeNm} nm`}.`}
                </p>
              </div>

              {/* Specifications Grid */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    Specifications
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Passengers:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.passengerCapacity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Luggage:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.luggageCapacity || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Speed:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cruiseSpeed || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Range:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.range || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hourly Rate:</span>
                      <span className="text-gray-900 font-semibold">
                        $
                        {viewingAircraft.hourlyRateUsd?.toLocaleString() || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    Cabin Dimensions
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Height:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cabinHeight || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Width:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cabinWidth || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Length:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cabinLength || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interior Images */}
              {viewingAircraft.interiorImages?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Interior</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingAircraft.interiorImages
                      .slice(0, 3)
                      .map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${viewingAircraft.name} interior ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Exterior Images */}
              {viewingAircraft.exteriorImages?.length > 1 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Exterior</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingAircraft.exteriorImages
                      .slice(1, 4)
                      .map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${viewingAircraft.name} exterior ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Select Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    handleSelectAircraft(viewingAircraft.id);
                    setViewingAircraft(null);
                  }}
                  className="bg-[#D4AF37] text-white hover:bg-[#B8962E]"
                >
                  {selectedAircraft.includes(viewingAircraft.id)
                    ? "Deselect"
                    : "Select"}{" "}
                  Aircraft
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
