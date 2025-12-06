import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aircraft.title,
  description: seoData.pages.aircraft.description,
};

export default function AircraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
