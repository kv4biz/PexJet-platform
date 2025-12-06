"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { cn } from "../lib/utils";

interface AnimatedListProps {
  children: ReactNode[];
  delay?: number;
  className?: string;
}

export function AnimatedList({
  children,
  delay = 1000,
  className,
}: AnimatedListProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < React.Children.count(children)) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, children, delay]);

  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.toArray(children).map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-500 ease-out",
            index < visibleCount
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 h-0 overflow-hidden",
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
