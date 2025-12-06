import type { Metadata } from "next";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.aboutAsset.title,
  description: seoData.pages.aboutAsset.description,
};

export default function AboutAssetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
