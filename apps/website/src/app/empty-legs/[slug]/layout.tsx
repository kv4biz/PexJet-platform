import { Metadata } from "next";
import { prisma } from "@pexjet/database";
import { seoData } from "@/data";
import StructuredData from "@/components/seo/StructuredData";

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
    const aircraftName =
      emptyLeg.aircraft?.name || emptyLeg.aircraftName || "Private Jet";
    const source = emptyLeg.source;
    const operatorName = emptyLeg.operatorName;

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

    // Format date without timezone conversion (stored as UTC representing local time)
    const dateStr = emptyLeg.departureDateTime
      ? (() => {
          const d = new Date(emptyLeg.departureDateTime);
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
        })()
      : "";

    // SEO-optimized title with source-specific keywords
    let title = `Private Jet ${departureCity} to ${arrivalCity} | Empty Leg Flight`;

    if (source === "INSTACHARTER") {
      title = `Verified Empty Leg ${departureCity} to ${arrivalCity} | Partner Deal`;
    } else if (source === "ADMIN") {
      title = `PexJet Exclusive Empty Leg ${departureCity} to ${arrivalCity}`;
    } else if (source === "OPERATOR") {
      title = `Operator Empty Leg ${departureCity} to ${arrivalCity} | ${operatorName || "Certified"}`;
    }

    // Rich description with source-specific messaging
    let description = `Book a private jet from ${departureCity} to ${arrivalCity}. Empty leg flight on ${aircraftName}${dateStr ? ` departing ${dateStr}` : ""}. Fly private for less with PexJet Nigeria.`;

    if (source === "INSTACHARTER") {
      description = `Verified partner empty leg from ${departureCity} to ${arrivalCity}. ${aircraftName}${dateStr ? ` departing ${dateStr}` : ""}. Trusted deal with quality assurance.`;
    } else if (source === "ADMIN") {
      description = `PexJet exclusive empty leg from ${departureCity} to ${arrivalCity}. ${aircraftName}${dateStr ? ` departing ${dateStr}` : ""}. Premium service guaranteed.`;
    } else if (source === "OPERATOR") {
      description = `Operator direct empty leg from ${departureCity} to ${arrivalCity}. ${aircraftName}${dateStr ? ` departing ${dateStr}` : ""}. Great value from ${operatorName || "certified operator"}.`;
    }

    // Additional keywords for this route and source
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

    // Add source-specific keywords
    if (source === "INSTACHARTER") {
      keywords.push("verified empty leg", "partner deal", "trusted charter");
    } else if (source === "ADMIN") {
      keywords.push(
        "PexJet exclusive",
        "premium empty leg",
        "guaranteed service",
      );
    } else if (source === "OPERATOR") {
      keywords.push(
        "operator direct",
        "certified operator",
        `${operatorName} charter`,
      );
    }

    const ogImage = `${seoData.siteUrl}/opengraph-image?type=empty-leg&slug=${slug}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&aircraft=${encodeURIComponent(aircraftName)}&price=${encodeURIComponent(priceText)}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: `${seoData.siteUrl}/empty-legs/${slug}`,
        siteName: seoData.siteName,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `Private jet flight from ${departureCity} to ${arrivalCity} on ${aircraftName}`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${departureCity} → ${arrivalCity} | ${source === "INSTACHARTER" ? "Verified" : source === "ADMIN" ? "PexJet Exclusive" : "Operator"} Empty Leg`,
        description,
        images: [
          `${seoData.siteUrl}/twitter-image?type=empty-leg&slug=${slug}&title=${encodeURIComponent(`${departureCity} to ${arrivalCity} | Empty Leg`)}&description=${encodeURIComponent(`${source === "INSTACHARTER" ? "Verified partner" : source === "ADMIN" ? "PexJet exclusive" : "Operator"} deal from ${departureCity} to ${arrivalCity}. ${aircraftName}${dateStr ? ` - ${dateStr}` : ""}.`)}&aircraft=${encodeURIComponent(aircraftName)}&price=${encodeURIComponent(priceText)}`,
        ],
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

export default function EmptyLegDetailLayout({ children, params }: Props) {
  return (
    <>
      <StructuredData
        type="empty-leg"
        data={{
          emptyLeg: {
            departureCity: "Unknown",
            arrivalCity: "Unknown",
            departureDateTime: new Date(),
            aircraft: { name: "Private Jet" },
          },
          pageUrl: `${seoData.siteUrl}/empty-legs/${params.slug}`,
        }}
      />
      {children}
    </>
  );
}
