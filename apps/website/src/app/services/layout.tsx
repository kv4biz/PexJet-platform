import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.services.title,
  description: seoData.pages.services.description,
  openGraph: {
    title: seoData.pages.services.title,
    description: seoData.pages.services.description,
    url: `${seoData.siteUrl}/services`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=services`,
        width: 1200,
        height: 630,
        alt: "PexJet Services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.services.title,
    description: seoData.pages.services.description,
    images: [`${seoData.siteUrl}/twitter-image?type=services`],
  },
  other: {
    "fb:app_id": "966242223397117", // Facebook App ID for debugging
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
