"use client";

import React, { createContext, useContext, useCallback } from "react";

interface CurrencyContextType {
  // Format price - takes USD value, returns formatted string
  formatPrice: (priceUsd: number) => string;
  // Get the display price value
  getPrice: (priceUsd: number) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const getPrice = useCallback((priceUsd: number): number => {
    return priceUsd;
  }, []);

  const formatPrice = useCallback((priceUsd: number): string => {
    return `$${priceUsd.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }, []);

  const symbol = "$";

  return (
    <CurrencyContext.Provider
      value={{
        formatPrice,
        getPrice,
        symbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
