import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.emptyLegs.title,
  description: seoData.pages.emptyLegs.description,
  openGraph: {
    title: seoData.pages.emptyLegs.title,
    description: seoData.pages.emptyLegs.description,
    url: `${seoData.siteUrl}/empty-legs`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=empty-legs&title=${encodeURIComponent("Empty Leg Flights – Save Up to 75%")}&description=${encodeURIComponent("Discover exclusive empty leg flight deals across Africa and beyond. Fly private at a fraction of the cost with PexJet's discounted repositioning flights.")}`,
        width: 1200,
        height: 630,
        alt: "PexJet Empty Leg Flights - Save up to 75% on Private Jets",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.emptyLegs.title,
    description: seoData.pages.emptyLegs.description,
    images: [
      `${seoData.siteUrl}/twitter-image?type=empty-legs&title=${encodeURIComponent("Empty Leg Flights – Save Up to 75%")}&description=${encodeURIComponent("Discover exclusive empty leg flight deals across Africa and beyond. Fly private at a fraction of the cost.")}`,
    ],
  },
  alternates: {
    canonical: `${seoData.siteUrl}/empty-legs`,
  },
};

export default function EmptyLegsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
