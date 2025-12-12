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
        url: seoData.openGraph.image,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: "PexJet Private Jet Charter",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.charter.title,
    description: seoData.pages.charter.description,
    images: [seoData.openGraph.image],
  },
};

export default function CharterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
