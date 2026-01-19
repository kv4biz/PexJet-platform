import { Metadata } from "next";
import { prisma } from "@pexjet/database";
import { seoData } from "@/data";
import StructuredData from "@/components/seo/StructuredData";

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;

  try {
    const aircraft = await prisma.aircraft.findUnique({
      where: { id },
      select: {
        name: true,
        category: true,
        maxPax: true,
        minPax: true,
        rangeNm: true,
        cruiseSpeedKnots: true,
        cabinLengthFt: true,
        cabinWidthFt: true,
        cabinHeightFt: true,
        baggageCuFt: true,
        image: true,
        manufacturer: true,
        availability: true,
      },
    });

    if (!aircraft) {
      return {
        title: "Aircraft Not Found",
        description: "This aircraft is no longer available in our fleet.",
      };
    }

    // Format specifications
    const passengerCapacity = aircraft.maxPax
      ? `${aircraft.minPax || 1}-${aircraft.maxPax} passengers`
      : "Private jet";

    const range = aircraft.rangeNm
      ? `${Math.round(aircraft.rangeNm).toLocaleString()} nm`
      : "Long range";

    const speed = aircraft.cruiseSpeedKnots
      ? `${Math.round(aircraft.cruiseSpeedKnots)} knots`
      : "High speed";

    // SEO-optimized title
    const title = `${aircraft.name} | ${aircraft.category} Private Jet`;

    // Rich description with specifications
    const description = `Charter the ${aircraft.name} ${aircraft.category} private jet. ${passengerCapacity}, ${range} range, ${speed} cruise speed. Luxury private aviation with PexJet Nigeria.`;

    // Keywords for this aircraft
    const keywords = [
      `${aircraft.name} charter`,
      `${aircraft.category} private jet`,
      `${aircraft.manufacturer} ${aircraft.name}`,
      `charter ${aircraft.name}`,
      `${aircraft.name} private jet Nigeria`,
      `${passengerCapacity} private jet`,
      `${range} private jet`,
      "luxury private jet charter",
      "business jet rental",
    ];

    const ogImage = `${seoData.siteUrl}/opengraph-image?type=aircraft&slug=${id}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&aircraft=${encodeURIComponent(aircraft.name)}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: `${seoData.siteUrl}/aircraft/${id}`,
        siteName: seoData.siteName,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${aircraft.name} ${aircraft.category} private jet charter`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          `${seoData.siteUrl}/twitter-image?type=aircraft&slug=${id}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(`${passengerCapacity} • ${range} • ${aircraft.name}`)}&aircraft=${encodeURIComponent(aircraft.name)}`,
        ],
      },
      alternates: {
        canonical: `${seoData.siteUrl}/aircraft/${id}`,
      },
    };
  } catch (error) {
    console.error("Error generating aircraft metadata:", error);
    return {
      title: "Private Jet Aircraft",
      description:
        "View this luxury private jet available for charter on PexJet.",
    };
  }
}

export default function AircraftDetailLayout({ children, params }: Props) {
  return (
    <>
      <StructuredData
        type="aircraft"
        data={{
          aircraft: {
            name: "Private Jet",
            category: "Business Jet",
          },
        }}
      />
      {children}
    </>
  );
}
