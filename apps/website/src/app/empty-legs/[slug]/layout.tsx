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
            thumbnailImage: true,
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
    const discountPercent = Math.round(
      ((emptyLeg.originalPriceUsd - emptyLeg.discountPriceUsd) /
        emptyLeg.originalPriceUsd) *
        100,
    );

    const title = `${departureCity} to ${arrivalCity} - ${discountPercent}% Off Empty Leg Flight`;
    const description = `Save ${discountPercent}% on this empty leg flight from ${departureCity}, ${departureCountry} to ${arrivalCity}, ${arrivalCountry} on a ${aircraftName}. Book now with PexJet.`;

    const ogImage = emptyLeg.aircraft.thumbnailImage || seoData.openGraph.image;

    return {
      title,
      description,
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
            alt: `${departureCity} to ${arrivalCity} Empty Leg Flight`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
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
