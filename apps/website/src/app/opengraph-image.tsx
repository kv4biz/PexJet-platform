import { ImageResponse } from "next/og";
import { prisma } from "@pexjet/database";
import {
  homePageData,
  aboutCompanyPageData,
  aboutAssetPageData,
  servicesData,
  aircraftManagementPageData,
  contactPageData,
  charterPageData,
  emptyLegsPageData,
} from "@/data";

export const runtime = "edge";

export const alt = "PexJet - Private Jet Charter & Luxury Air Travel";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params?: { slug?: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Image({ params, searchParams }: Props) {
  const pageType = searchParams?.type || "home";
  const slug = params?.slug;
  const title = searchParams?.title || "PexJet";
  const description =
    searchParams?.description || "Private Jet Charter & Luxury Air Travel";
  const aircraft = searchParams?.aircraft;
  const price = searchParams?.price;
  const route = searchParams?.route;

  // Default fallback image
  const defaultImage =
    "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764998923/pixverse-i2i-ori-9076e189-b32b-46cc-8701-506838512428_lkeyv0.png";

  // Fetch specific data if we have a slug
  let specificData = null;
  let backgroundImage = defaultImage;
  let overlayOpacity = 0.3;

  try {
    if (slug && pageType === "empty-leg") {
      try {
        specificData = await prisma.emptyLeg.findUnique({
          where: { slug },
          include: {
            aircraft: {
              select: {
                name: true,
                image: true,
              },
            },
            departureAirport: {
              select: {
                name: true,
                municipality: true,
              },
            },
            arrivalAirport: {
              select: {
                name: true,
                municipality: true,
              },
            },
          },
        });

        // Set background image for empty leg
        if (specificData) {
          if (
            specificData.source === "INSTACHARTER" &&
            specificData.aircraftImage
          ) {
            backgroundImage = specificData.aircraftImage;
          } else if (specificData.aircraft?.image) {
            backgroundImage = specificData.aircraft.image;
          } else if (specificData.aircraftImage) {
            backgroundImage = specificData.aircraftImage;
          } else {
            backgroundImage = defaultImage;
          }
          overlayOpacity = 0.2;
        }
      } catch (error) {
        console.error("Error fetching empty leg data:", error);
      }
    } else if (slug && pageType === "aircraft") {
      try {
        specificData = await prisma.aircraft.findUnique({
          where: { id: slug },
          select: {
            name: true,
            category: true,
            image: true,
            maxPax: true,
          },
        });

        // Set background image for aircraft
        if (specificData?.image) {
          backgroundImage = specificData.image;
          overlayOpacity = 0.2;
        } else {
          backgroundImage = defaultImage;
        }
      } catch (error) {
        console.error("Error fetching aircraft data:", error);
      }
    }

    // Determine which image to use for static pages
    if (backgroundImage === defaultImage) {
      if (pageType === "home") {
        // Use hero image from home page data
        backgroundImage = homePageData.hero.imageURL;
        overlayOpacity = 0.4;
      } else if (pageType === "about") {
        // Use hero image from about page data
        backgroundImage = aboutCompanyPageData.hero.backgroundImage;
        overlayOpacity = 0.4;
      } else if (pageType === "about-asset") {
        // Use hero image from about asset page data
        backgroundImage = aboutAssetPageData.hero.backgroundImage;
        overlayOpacity = 0.4;
      } else if (pageType === "services") {
        // Use hero image from services page data
        backgroundImage = servicesData.hero.image;
        overlayOpacity = 0.4;
      } else if (pageType === "aircraft-management") {
        // Use hero image from aircraft management page data
        backgroundImage = aircraftManagementPageData.hero.image;
        overlayOpacity = 0.4;
      } else if (pageType === "contact") {
        // Use hero image from contact page data
        backgroundImage = contactPageData.hero.backgroundImage;
        overlayOpacity = 0.4;
      } else if (pageType === "charter") {
        // Use hero image from charter page data
        backgroundImage = charterPageData.hero.backgroundImage;
        overlayOpacity = 0.4;
      } else if (pageType === "empty-legs") {
        // Use hero image from empty legs page data
        backgroundImage = emptyLegsPageData.hero.backgroundImage;
        overlayOpacity = 0.4;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
    backgroundImage = defaultImage;
    overlayOpacity = 0.3;
  }

  return new ImageResponse(
    <div
      style={{
        fontSize: 48,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay for text readability */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(26, 26, 46, ${overlayOpacity})`,
          zIndex: 1,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 30,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "#D4AF37",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          PexJet
        </div>
      </div>

      {/* Dynamic content based on page type */}
      {pageType === "empty-leg" && specificData && (
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div
            style={{
              fontSize: 32,
              color: "#ffffff",
              marginBottom: 15,
              fontWeight: "600",
            }}
          >
            Empty Leg Deal
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#D4AF37",
              marginBottom: 10,
            }}
          >
            {specificData.departureCity ||
              specificData.departureAirport?.municipality}{" "}
            →{" "}
            {specificData.arrivalCity ||
              specificData.arrivalAirport?.municipality}
          </div>
          {/* Source-specific aircraft info */}
          <div
            style={{
              fontSize: 20,
              color: "#ffffff",
              marginBottom: 8,
            }}
          >
            {specificData.source === "INSTACHARTER" &&
              specificData.aircraftName &&
              `${specificData.aircraftName} ${specificData.aircraftType || ""}`}
            {specificData.source === "ADMIN" &&
              specificData.aircraft &&
              specificData.aircraft.name}
            {specificData.source === "OPERATOR" &&
              specificData.aircraftName &&
              specificData.aircraftName}
            {!specificData.aircraftName &&
              !specificData.aircraft &&
              "Private Jet"}
          </div>
          {/* Source indicator */}
          <div
            style={{
              fontSize: 16,
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            {specificData.source === "INSTACHARTER" && "✓ Verified Partner"}
            {specificData.source === "ADMIN" && "🏢 PexJet Exclusive"}
            {specificData.source === "OPERATOR" &&
              `✈️ ${specificData.operatorName || "Certified Operator"}`}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#4ade80",
              fontWeight: "bold",
            }}
          >
            Save up to 75%
          </div>
        </div>
      )}

      {pageType === "aircraft" && specificData && (
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div
            style={{
              fontSize: 32,
              color: "#ffffff",
              marginBottom: 15,
              fontWeight: "600",
            }}
          >
            {specificData.name}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#D4AF37",
              marginBottom: 10,
            }}
          >
            {specificData.category} • {specificData.maxPax} Passengers
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#ffffff",
            }}
          >
            Premium Private Aviation
          </div>
        </div>
      )}

      {pageType === "charter" && (
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div
            style={{
              fontSize: 36,
              color: "#ffffff",
              marginBottom: 20,
              fontWeight: "600",
            }}
          >
            Private Jet Charter
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#D4AF37",
              marginBottom: 15,
            }}
          >
            Fly Anywhere • Anytime
          </div>
          {route && (
            <div
              style={{
                fontSize: 18,
                color: "#ffffff",
                marginBottom: 10,
              }}
            >
              {route}
            </div>
          )}
          <div
            style={{
              fontSize: 24,
              color: "#ffffff",
            }}
          >
            Luxury • Comfort • Privacy
          </div>
        </div>
      )}

      {/* Default content */}
      {(!pageType || pageType === "home") && (
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div
            style={{
              fontSize: 36,
              color: "#ffffff",
              marginBottom: 20,
              fontWeight: "600",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#D4AF37",
              marginBottom: 15,
            }}
          >
            {description}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#ffffff",
            }}
          >
            Fly Private. Fly Premium.
          </div>
        </div>
      )}

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          fontSize: 18,
          color: "#D4AF37",
          fontWeight: "500",
          zIndex: 1,
        }}
      >
        pexjet.com
      </div>
    </div>,
    {
      ...size,
    },
  );
}
