import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aboutOperator.title,
  description: seoData.pages.aboutOperator.description,
  openGraph: {
    title: seoData.pages.aboutOperator.title,
    description: seoData.pages.aboutOperator.description,
    url: `${seoData.siteUrl}/about/operator`,
    siteName: seoData.siteName,
    images: [
      {
        url: seoData.openGraph.image,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: "PexJet Operators",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.aboutOperator.title,
    description: seoData.pages.aboutOperator.description,
    images: [seoData.openGraph.image],
  },
};

export default function AboutOperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
