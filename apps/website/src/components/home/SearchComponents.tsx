"use client";

import CharterSearch from "./CharterSearch";
import EmptyLegSearch from "./EmptyLegSearch";

export default function SearchComponents() {
  return (
    <div className="py-6 sm:py-10 bg-[#F7f7f7] relative z-30">
      <div className="w-full mx-auto px-4 lg:px-8 overflow-visible">
        <div className="lg:-mt-72 relative z-40 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 sm:gap-8">
          {/* Left Side - Charter Search */}
          <div className="w-full lg:flex-1 lg:max-w-3xl min-w-0">
            <CharterSearch />
          </div>

          {/* Right Side - Empty Leg Search */}
          <div className="w-full lg:flex-1 lg:max-w-3xl min-w-0">
            <EmptyLegSearch />
          </div>
        </div>
      </div>
    </div>
  );
}
