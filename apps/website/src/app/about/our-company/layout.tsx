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
        url: seoData.openGraph.image,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: "About PexJet",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.aboutCompany.title,
    description: seoData.pages.aboutCompany.description,
    images: [seoData.openGraph.image],
  },
};

export default function AboutCompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
