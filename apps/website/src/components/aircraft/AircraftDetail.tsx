"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@pexjet/ui";
import { aircraftPageData } from "@/data";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  availability: string;
  basePricePerHour: number | null;
  cabinLengthFt: number | null;
  cabinWidthFt: number | null;
  cabinHeightFt: number | null;
  baggageCuFt: number | null;
  exteriorHeightFt: number | null;
  exteriorLengthFt: number | null;
  exteriorWingspanFt: number | null;
  image: string | null;
  maxPax: number | null;
  minPax: number | null;
  cruiseSpeedKnots: number | null;
  fuelCapacityGal: number | null;
  rangeNm: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  aircraft: Aircraft;
}

export default function AircraftDetail({ aircraft }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "N/A";
    return num.toLocaleString();
  };

  const formatDimension = (feet: number | null | undefined): string => {
    if (feet === null || feet === undefined) return "N/A";
    return `${feet.toLocaleString()} ft`;
  };

  const specifications = [
    {
      label: aircraftPageData.specifications.labels.aircraftName,
      value: aircraft.name,
    },
    {
      label: aircraftPageData.specifications.labels.aircraftType,
      value: aircraft.category,
    },
    {
      label: aircraftPageData.specifications.labels.passengerCapacity,
      value:
        aircraft.minPax && aircraft.maxPax
          ? `${aircraft.minPax}-${aircraft.maxPax}`
          : formatNumber(aircraft.maxPax),
    },
    {
      label: aircraftPageData.specifications.labels.interiorHeight,
      value: formatDimension(aircraft.cabinHeightFt),
    },
    {
      label: aircraftPageData.specifications.labels.interiorWidth,
      value: formatDimension(aircraft.cabinWidthFt),
    },
    {
      label: aircraftPageData.specifications.labels.cabinLength,
      value: formatDimension(aircraft.cabinLengthFt),
    },
    {
      label: aircraftPageData.specifications.labels.luggageCapacity,
      value: formatDimension(aircraft.baggageCuFt),
    },
    {
      label: aircraftPageData.specifications.labels.range,
      value: `${formatNumber(aircraft.rangeNm)} nm`,
    },
    {
      label: aircraftPageData.specifications.labels.cruiseSpeed,
      value: `${formatNumber(aircraft.cruiseSpeedKnots)} knots`,
    },
  ];

  const images = aircraft.image ? [aircraft.image] : [];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-[#1a1a2e] to-[#16213e]">
        <div className="absolute inset-0">
          {images.length > 0 ? (
            <Image
              src={images[selectedImage]}
              alt={`${aircraft.name} - ${aircraft.category}`}
              fill
              className="object-cover opacity-30"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent" />
          )}
        </div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">{aircraft.name}</h1>
            <p className="text-xl text-[#D4AF37] mb-2">{aircraft.category}</p>
            <p className="text-lg opacity-90">{aircraft.manufacturer}</p>

            <div className="mt-6 flex gap-4 justify-center">
              <Badge
                variant={
                  aircraft.availability === "INTERNATIONAL" ||
                  aircraft.availability === "BOTH"
                    ? "default"
                    : "secondary"
                }
                className="bg-[#D4AF37] text-white"
              >
                {aircraftPageData.badges.international}
              </Badge>
              {aircraft.availability === "LOCAL" && (
                <Badge variant="outline" className="border-white text-white">
                  {aircraftPageData.badges.local}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {aircraftPageData.specifications.title}
          </h2>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {specifications.map((spec, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0"
                >
                  <span className="text-gray-600 font-medium">
                    {spec.label}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {aircraft.basePricePerHour && (
              <div className="mt-8 p-4 bg-[#D4AF37]/10 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    ${aircraft.basePricePerHour.toLocaleString()}/hour
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      {images.length > 1 && (
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              {aircraftPageData.gallery.title}
            </h2>

            <div className="flex gap-4 justify-center flex-wrap">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-32 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-[#D4AF37] scale-105"
                      : "border-gray-300"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${aircraft.name} view ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Fly on the {aircraft.name}?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Experience luxury private aviation with this exceptional{" "}
            {aircraft.category}
          </p>
          <Link
            href="/charter"
            className="inline-block bg-[#D4AF37] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#B8941F] transition-colors"
          >
            {aircraftPageData.cta.text}
          </Link>
        </div>
      </div>
    </div>
  );
}
