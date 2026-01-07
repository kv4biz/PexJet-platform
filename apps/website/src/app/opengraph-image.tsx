import { ImageResponse } from "next/og";
import { prisma } from "@pexjet/database";

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

  // Fetch specific data if we have a slug
  let specificData = null;
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
    } catch (error) {
      console.error("Error fetching aircraft data:", error);
    }
  }

  return new ImageResponse(
    <div
      style={{
        fontSize: 48,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
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
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
