import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aboutCompany.title,
  description: seoData.pages.aboutCompany.description,
  openGraph: {
    title: seoData.pages.aboutCompany.title,
    description: seoData.pages.aboutCompany.description,
    url: `${seoData.siteUrl}/about/our-company`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=about`,
        width: 1200,
        height: 630,
        alt: "About PexJet",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.aboutCompany.title,
    description: seoData.pages.aboutCompany.description,
    images: [`${seoData.siteUrl}/twitter-image?type=about`],
  },
  other: {
    "fb:app_id": "966242223397117", // Facebook App ID for debugging
  },
};

export default function AboutCompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
