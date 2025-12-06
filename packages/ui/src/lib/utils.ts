import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PEXJET_COLORS = {
  gold: {
    DEFAULT: "#C9A227",
    light: "#D4AF37",
    dark: "#B8860B",
    50: "#FDF8E7",
    100: "#FAF0CF",
    200: "#F5E19F",
    300: "#F0D26F",
    400: "#EBC33F",
    500: "#C9A227",
    600: "#A1821F",
    700: "#796117",
    800: "#51410F",
    900: "#282008",
  },
} as const;
