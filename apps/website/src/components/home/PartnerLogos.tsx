"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { homePageData } from "@/data";

// Scroll threshold: only scroll if more than 5 logos
const SCROLL_THRESHOLD = 5;

export default function PartnerLogos() {
  const { partnerLogos } = homePageData;
  const [shouldScroll, setShouldScroll] = useState(true); // Default to true for SSR

  useEffect(() => {
    // Only scroll if more than 5 logos
    setShouldScroll(partnerLogos.logos.length > SCROLL_THRESHOLD);
  }, [partnerLogos.logos.length]);

  // Duplicate logos for seamless infinite scroll
  const displayLogos = shouldScroll
    ? [...partnerLogos.logos, ...partnerLogos.logos]
    : partnerLogos.logos;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes partner-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partner-slider {
          animation: partner-scroll 30s linear infinite;
        }
        .partner-slider:hover {
          animation-play-state: paused;
        }
      `,
        }}
      />
      <section className="py-20 lg:py-24 bg-white overflow-hidden">
        <div className="w-full container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <p className="text-center text-sm uppercase tracking-widest text-gray-500">
            {partnerLogos.title}
          </p>
        </div>

        {/* Logo Display - Slider or Static */}
        <div className="relative">
          <div
            className={`flex ${shouldScroll ? "partner-slider" : "justify-center flex-wrap gap-y-6"}`}
          >
            {displayLogos.map((logo, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-6 md:mx-10 flex items-center justify-center"
              >
                <Image
                  src={logo.image}
                  alt={logo.name}
                  width={1200}
                  height={600}
                  className="h-16 md:h-28 lg:h-32 w-auto object-contain opacity-80 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
