import { ImageResponse } from "next/og";
import { prisma } from "@pexjet/database";

export const runtime = "edge";

export const alt = "PexJet - Private Jet Charter & Luxury Air Travel";
export const size = {
  width: 1200,
  height: 600,
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
        fontSize: 42,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
          opacity: 0.08,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D4AF37' fill-opacity='0.6'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm0 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 25,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "#D4AF37",
            textShadow: "0 2px 4px rgba(0,0,0,0.4)",
          }}
        >
          PexJet
        </div>
      </div>

      {/* Dynamic content based on page type */}
      {pageType === "empty-leg" && specificData && (
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 28,
              color: "#ffffff",
              marginBottom: 12,
              fontWeight: "600",
            }}
          >
            ✈️ Empty Leg Deal
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#D4AF37",
              marginBottom: 8,
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
              fontSize: 18,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            🛩️{" "}
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
              fontSize: 14,
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            {specificData.source === "INSTACHARTER" &&
              "✓ Verified Partner Deal"}
            {specificData.source === "ADMIN" && "🏢 PexJet Exclusive Deal"}
            {specificData.source === "OPERATOR" &&
              `✈️ ${specificData.operatorName || "Operator"} Deal`}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#4ade80",
              fontWeight: "bold",
            }}
          >
            💰 Save up to 75% • Book Now!
          </div>
        </div>
      )}

      {pageType === "aircraft" && specificData && (
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 28,
              color: "#ffffff",
              marginBottom: 12,
              fontWeight: "600",
            }}
          >
            ✈️ {specificData.name}
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#D4AF37",
              marginBottom: 8,
            }}
          >
            {specificData.category} • {specificData.maxPax} Passengers
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#ffffff",
            }}
          >
            🌟 Premium Private Aviation Experience
          </div>
        </div>
      )}

      {pageType === "charter" && (
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 32,
              color: "#ffffff",
              marginBottom: 16,
              fontWeight: "600",
            }}
          >
            ✈️ Private Jet Charter
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#D4AF37",
              marginBottom: 12,
            }}
          >
            Fly Anywhere • Anytime • On Demand
          </div>
          {route && (
            <div
              style={{
                fontSize: 16,
                color: "#e2e8f0",
                marginBottom: 8,
              }}
            >
              📍 {route}
            </div>
          )}
          <div
            style={{
              fontSize: 20,
              color: "#ffffff",
            }}
          >
            🥂 Luxury • Comfort • Privacy
          </div>
        </div>
      )}

      {/* Default content */}
      {(!pageType || pageType === "home") && (
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 32,
              color: "#ffffff",
              marginBottom: 16,
              fontWeight: "600",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#D4AF37",
              marginBottom: 12,
            }}
          >
            {description}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#ffffff",
            }}
          >
            🌟 Fly Private. Fly Premium.
          </div>
        </div>
      )}

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 25,
          fontSize: 16,
          color: "#D4AF37",
          fontWeight: "500",
          zIndex: 1,
        }}
      >
        🌐 pexjet.com • 24/7 Service
      </div>
    </div>,
    {
      ...size,
    },
  );
}
