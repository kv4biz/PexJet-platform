import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.emptyLegs.title,
  description: seoData.pages.emptyLegs.description,
};

export default function EmptyLegsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
