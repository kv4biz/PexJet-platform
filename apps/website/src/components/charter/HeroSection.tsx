// components/charter/HeroSection.tsx
"use client";
import { charterPageData } from "../../data";
import { CompactSearchForm } from "./CompactSearchForm";

const HeroSection = () => {
  const handleSearch = (data: any) => {
    // Dispatch custom event to notify MultiStepFormSection
    const event = new CustomEvent("searchSubmitted", { detail: data });
    window.dispatchEvent(event);
  };

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center py-24 pt-32">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={charterPageData.hero.backgroundImage}
          alt="Charter Your Journey"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
        <CompactSearchForm onSearch={handleSearch} />
      </div>
    </section>
  );
};

export default HeroSection;
