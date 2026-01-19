import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.contact.title,
  description: seoData.pages.contact.description,
  openGraph: {
    title: seoData.pages.contact.title,
    description: seoData.pages.contact.description,
    url: `${seoData.siteUrl}/contact`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=contact`,
        width: 1200,
        height: 630,
        alt: "Contact PexJet",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.contact.title,
    description: seoData.pages.contact.description,
    images: [`${seoData.siteUrl}/twitter-image?type=contact`],
  },
  other: {
    "fb:app_id": "966242223397117", // Facebook App ID for debugging
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
