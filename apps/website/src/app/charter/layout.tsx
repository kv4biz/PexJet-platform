import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.charter.title,
  description: seoData.pages.charter.description,
  openGraph: {
    title: seoData.pages.charter.title,
    description: seoData.pages.charter.description,
    url: `${seoData.siteUrl}/charter`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=charter&title=${encodeURIComponent("Private Jet Charter Services")}&description=${encodeURIComponent("Fly anywhere in the world with luxury private jets. Flexible schedules, dedicated service, and access to 500+ aircraft.")}`,
        width: 1200,
        height: 630,
        alt: "PexJet Private Jet Charter - Luxury Air Travel",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.charter.title,
    description: seoData.pages.charter.description,
    images: [
      `${seoData.siteUrl}/twitter-image?type=charter&title=${encodeURIComponent("Private Jet Charter Services")}&description=${encodeURIComponent("Fly anywhere in the world with luxury private jets. Flexible schedules, dedicated service, and access to 500+ aircraft.")}`,
    ],
  },
  alternates: {
    canonical: `${seoData.siteUrl}/charter`,
  },
};

export default function CharterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
