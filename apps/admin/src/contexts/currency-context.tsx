"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Currency = "NGN" | "USD";

interface CurrencyContextType {
  currency: Currency;
  rate: number;
  toggleCurrency: () => void;
  formatAmount: (amountNgn: number, amountUsd?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [rate, setRate] = useState(1650);

  // Fetch current exchange rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("/api/settings/exchange-rate");
        if (response.ok) {
          const data = await response.json();
          setRate(data.rate || 1650);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };
    fetchRate();
  }, []);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "NGN" ? "USD" : "NGN"));
  };

  const formatAmount = (amountNgn: number, amountUsd?: number): string => {
    if (currency === "NGN") {
      return `₦${amountNgn.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      // Use provided USD amount or calculate from NGN
      const usd = amountUsd !== undefined ? amountUsd : amountNgn / rate;
      return `$${usd.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, rate, toggleCurrency, formatAmount }}
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
