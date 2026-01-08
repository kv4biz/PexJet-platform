import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aircraftManagement.title,
  description: seoData.pages.aircraftManagement.description,
  openGraph: {
    title: seoData.pages.aircraftManagement.title,
    description: seoData.pages.aircraftManagement.description,
    url: `${seoData.siteUrl}/aircraft-management`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=aircraft-management`,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: "PexJet Aircraft Management",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.aircraftManagement.title,
    description: seoData.pages.aircraftManagement.description,
    images: [`${seoData.siteUrl}/twitter-image?type=aircraft-management`],
  },
  alternates: {
    canonical: `${seoData.siteUrl}/aircraft-management`,
  },
};

export default function AircraftManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
