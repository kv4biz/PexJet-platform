import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aircraft.title,
  description: seoData.pages.aircraft.description,
  openGraph: {
    title: seoData.pages.aircraft.title,
    description: seoData.pages.aircraft.description,
    url: `${seoData.siteUrl}/aircraft`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=aircraft&title=${encodeURIComponent("Our Aircraft Fleet")}&description=${encodeURIComponent("Browse our diverse fleet of private jets – from light jets to heavy long-range aircraft. Find the perfect aircraft for your journey.")}`,
        width: 1200,
        height: 630,
        alt: "PexJet Aircraft Fleet - Private Jets for Every Journey",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.aircraft.title,
    description: seoData.pages.aircraft.description,
    images: [
      `${seoData.siteUrl}/twitter-image?type=aircraft&title=${encodeURIComponent("Our Aircraft Fleet")}&description=${encodeURIComponent("Browse our diverse fleet of private jets – from light jets to heavy long-range aircraft.")}`,
    ],
  },
  alternates: {
    canonical: `${seoData.siteUrl}/aircraft`,
  },
};

export default function AircraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
