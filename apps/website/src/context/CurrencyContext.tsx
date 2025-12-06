"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type Currency = "USD" | "NGN";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  exchangeRate: number; // NGN per 1 USD
  // Format price - takes NGN and USD values, returns formatted string based on selected currency
  formatPrice: (priceNgn: number, priceUsd: number) => string;
  // Get the display price value
  getPrice: (priceNgn: number, priceUsd: number) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(1650); // Default rate

  // Fetch exchange rate from admin settings
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch("/api/settings/exchange-rate");
        if (response.ok) {
          const data = await response.json();
          if (data.rate) {
            setExchangeRate(data.rate);
          }
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };

    fetchExchangeRate();
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => (prev === "USD" ? "NGN" : "USD"));
  }, []);

  const getPrice = useCallback(
    (priceNgn: number, priceUsd: number): number => {
      return currency === "NGN" ? priceNgn : priceUsd;
    },
    [currency],
  );

  const formatPrice = useCallback(
    (priceNgn: number, priceUsd: number): string => {
      if (currency === "NGN") {
        return `₦${priceNgn.toLocaleString("en-NG", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
      }
      return `$${priceUsd.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    },
    [currency],
  );

  const symbol = currency === "USD" ? "$" : "₦";

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate,
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
