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
        url: seoData.openGraph.image,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: "PexJet Empty Leg Flights",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.emptyLegs.title,
    description: seoData.pages.emptyLegs.description,
    images: [seoData.openGraph.image],
  },
};

export default function EmptyLegsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
