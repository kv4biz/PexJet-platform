"use client";

import CharterSearch from "./CharterSearch";
import EmptyLegSearch from "./EmptyLegSearch";

export default function SearchComponents() {
  return (
    <div className="pt-10 bg-[#F7f7f7]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:-mt-72 relative z-20 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">
          {/* Left Side - Charter Search */}
          <div className="w-full lg:max-w-3xl">
            <CharterSearch />
          </div>

          {/* Right Side - Empty Leg Search */}
          <div className="w-full lg:max-w-3xl">
            <EmptyLegSearch />
          </div>
        </div>
      </div>
    </div>
  );
}
