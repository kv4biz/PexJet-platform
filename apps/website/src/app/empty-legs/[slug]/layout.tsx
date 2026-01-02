import { Metadata } from "next";
import { prisma } from "@pexjet/database";
import { seoData } from "@/data";

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;

  try {
    const emptyLeg = await prisma.emptyLeg.findUnique({
      where: { slug },
      include: {
        departureAirport: {
          select: {
            name: true,
            municipality: true,
            country: { select: { name: true } },
          },
        },
        arrivalAirport: {
          select: {
            name: true,
            municipality: true,
            country: { select: { name: true } },
          },
        },
        aircraft: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!emptyLeg) {
      return {
        title: "Empty Leg Not Found",
        description: "This empty leg deal is no longer available.",
      };
    }

    const departureCity = emptyLeg.departureAirport.municipality || "Unknown";
    const arrivalCity = emptyLeg.arrivalAirport.municipality || "Unknown";
    const departureCountry = emptyLeg.departureAirport.country?.name || "";
    const arrivalCountry = emptyLeg.arrivalAirport.country?.name || "";
    const aircraftName = emptyLeg.aircraft.name;

    // Handle pricing based on priceType and priceUsd
    let priceText = "";
    let priceUsd = 0;

    if (emptyLeg.priceType === "CONTACT") {
      priceText = "Contact for price";
    } else if (
      emptyLeg.priceType === "FIXED" &&
      emptyLeg.priceUsd &&
      emptyLeg.priceUsd > 0
    ) {
      priceUsd = emptyLeg.priceUsd;
      priceText = `$${emptyLeg.priceUsd.toLocaleString()}`;
    } else {
      priceText = "Contact for price";
    }

    const dateStr = emptyLeg.departureDateTime
      ? new Date(emptyLeg.departureDateTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

    // SEO-optimized title with searchable keywords
    const title = `Private Jet ${departureCity} to ${arrivalCity} | Empty Leg Flight`;

    // Rich description with keywords people search for
    const description = `Book a private jet from ${departureCity} to ${arrivalCity}. Empty leg flight on ${aircraftName}${dateStr ? ` departing ${dateStr}` : ""}. Fly private for less with PexJet Nigeria.`;

    // Additional keywords for this route
    const keywords = [
      `${departureCity} to ${arrivalCity} private jet`,
      `flight from ${departureCity} to ${arrivalCity}`,
      `${departureCity} ${arrivalCity} empty leg`,
      `private jet ${departureCountry} to ${arrivalCountry}`,
      `cheap private jet ${departureCity}`,
      `${aircraftName} charter`,
      "empty leg flights Nigeria",
      "discounted private jet",
    ];

    const ogImage = emptyLeg.aircraft.image || seoData.openGraph.image;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${departureCity} to ${arrivalCity} | PexJet Empty Leg`,
        description,
        url: `${seoData.siteUrl}/empty-legs/${slug}`,
        siteName: seoData.siteName,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `Private jet flight from ${departureCity} to ${arrivalCity}`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${departureCity} → ${arrivalCity} | Private Jet Empty Leg`,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: `${seoData.siteUrl}/empty-legs/${slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Empty Leg Flight",
      description: "View this exclusive empty leg deal on PexJet.",
    };
  }
}

export default function EmptyLegDetailLayout({ children }: Props) {
  return <>{children}</>;
}
