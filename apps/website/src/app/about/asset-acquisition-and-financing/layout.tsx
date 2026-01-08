import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aboutAsset.title,
  description: seoData.pages.aboutAsset.description,
  openGraph: {
    title: seoData.pages.aboutAsset.title,
    description: seoData.pages.aboutAsset.description,
    url: `${seoData.siteUrl}/about/asset-acquisition-and-financing`,
    siteName: seoData.siteName,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=about-asset`,
        width: 1200,
        height: 630,
        alt: "PexJet Asset Acquisition",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.aboutAsset.title,
    description: seoData.pages.aboutAsset.description,
    images: [`${seoData.siteUrl}/twitter-image?type=about-asset`],
  },
  other: {
    "fb:app_id": "966242223397117", // Facebook App ID for debugging
  },
};

export default function AboutAssetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
