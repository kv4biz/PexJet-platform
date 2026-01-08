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
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
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
};

export default function AboutAssetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
