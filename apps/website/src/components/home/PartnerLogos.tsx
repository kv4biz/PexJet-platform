"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { homePageData } from "@/data";

// Thresholds: how many logos fit on each screen size
const LOGOS_PER_SCREEN = {
  mobile: 3, // < 640px
  tablet: 5, // < 1024px
  desktop: 7, // >= 1024px
};

export default function PartnerLogos() {
  const { partnerLogos } = homePageData;
  const [shouldScroll, setShouldScroll] = useState(true); // Default to true for SSR

  useEffect(() => {
    const checkScrollNeeded = () => {
      const logoCount = partnerLogos.logos.length;
      const width = window.innerWidth;

      let threshold = LOGOS_PER_SCREEN.desktop;
      if (width < 640) {
        threshold = LOGOS_PER_SCREEN.mobile;
      } else if (width < 1024) {
        threshold = LOGOS_PER_SCREEN.tablet;
      }

      setShouldScroll(logoCount > threshold);
    };

    checkScrollNeeded();
    window.addEventListener("resize", checkScrollNeeded);
    return () => window.removeEventListener("resize", checkScrollNeeded);
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
      <section className="py-16 bg-white hidden overflow-hidden">
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
                  width={120}
                  height={60}
                  className="h-12 md:h-16 w-auto object-contain opacity-80 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
