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
        width: 1200,
        height: 630,
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
  other: {
    "fb:app_id": "966242223397117", // Facebook App ID for debugging
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
