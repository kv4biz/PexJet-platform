// components/charter/LoadingAnimation.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingAnimationProps {
  onComplete: () => void;
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [visibleItems, setVisibleItems] = useState<number>(0);

  const items = [
    {
      key: "distance",
      title: "Calculating Distance",
      description: "Measuring optimal flight path...",
      icon: "📐",
    },
    {
      key: "availability",
      title: "Checking Aircraft Availability",
      description: "Searching our fleet database...",
      icon: "✈️",
    },
    {
      key: "pricing",
      title: "Calculating Best Prices",
      description: "Finding competitive rates...",
      icon: "💰",
    },
    {
      key: "jets",
      title: "Matching Available Jets",
      description: "Selecting perfect aircraft for your journey...",
      icon: "🛩️",
    },
    {
      key: "complete",
      title: "Ready to Go!",
      description: "Found the best options for you",
      icon: "✅",
    },
  ];

  // Animate items appearing one by one
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        if (prev < items.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [items.length]);

  // Auto-complete when all items are shown
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 7500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative mx-auto lg:items-start h-100 w-[400px] cursor-pointer overflow-hidden">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Finding Your Perfect Jet</h3>
        <p className="text-gray-600">We're searching our global network</p>
      </div>

      <div className="w-full space-y-3">
        {items.slice(0, visibleItems).map((item, index) => (
          <div
            key={item.key}
            className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            {index === items.length - 1 && visibleItems === items.length && (
              <div className="w-2 h-2 bg-green-500 animate-ping" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          Preparing your options...
        </div>
      </div>
    </div>
  );
}
