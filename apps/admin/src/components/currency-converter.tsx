"use client";

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@pexjet/ui";
import { DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

export function CurrencyToggle() {
  const { currency, rate, toggleCurrency } = useCurrency();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCurrency}
            className="gap-2 font-medium"
            title="Toggle Currency Display"
          >
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">
              {currency === "NGN" ? "₦ NGN" : "$ USD"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to show prices in {currency === "NGN" ? "USD" : "NGN"}</p>
          <p className="text-xs text-muted-foreground">
            Rate: $1 = ₦{rate.toLocaleString()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
