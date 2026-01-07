import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { Toaster } from "@pexjet/ui";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { seoData } from "@/data";
import StructuredData from "@/components/seo/StructuredData";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL(seoData.siteUrl),
  title: {
    default: seoData.defaultTitle,
    template: `%s | ${seoData.siteName}`,
  },
  description: seoData.defaultDescription,
  keywords: seoData.keywords,
  authors: [{ name: seoData.siteName }],
  creator: seoData.siteName,
  publisher: seoData.siteName,
  icons: {
    icon: seoData.favicon,
    shortcut: seoData.favicon,
    apple: seoData.favicon,
  },
  manifest: "/manifest.json",
  openGraph: {
    type: seoData.openGraph.type as "website",
    locale: seoData.openGraph.locale,
    url: seoData.siteUrl,
    siteName: seoData.siteName,
    title: seoData.defaultTitle,
    description: seoData.defaultDescription,
    images: [
      {
        url: `${seoData.siteUrl}/opengraph-image?type=home&title=${encodeURIComponent(seoData.defaultTitle)}&description=${encodeURIComponent(seoData.defaultDescription)}`,
        width: seoData.openGraph.imageWidth,
        height: seoData.openGraph.imageHeight,
        alt: seoData.siteName,
      },
    ],
  },
  twitter: {
    card: seoData.twitter.card as "summary_large_image",
    site: seoData.twitter.site,
    creator: seoData.twitter.creator,
    title: seoData.defaultTitle,
    description: seoData.defaultDescription,
    images: [
      `${seoData.siteUrl}/twitter-image?type=home&title=${encodeURIComponent(seoData.defaultTitle)}&description=${encodeURIComponent(seoData.defaultDescription)}`,
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: seoData.siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <StructuredData type="organization" />
        <StructuredData type="website" />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider>
            {children}
            <Toaster />
            <WhatsAppWidget />
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
