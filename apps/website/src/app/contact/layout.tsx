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
        url: seoData.openGraph.image,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: "Contact PexJet",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.contact.title,
    description: seoData.pages.contact.description,
    images: [seoData.openGraph.image],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
