import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "PexJet - Private Jet Charter & Luxury Air Travel";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "#D4AF37",
          }}
        >
          PexJet
        </div>
      </div>
      <div
        style={{
          fontSize: 36,
          color: "#ffffff",
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        Private Jet Charter & Luxury Air Travel
      </div>
      <div
        style={{
          fontSize: 24,
          color: "#D4AF37",
          marginTop: 30,
        }}
      >
        Fly Private. Fly Premium.
      </div>
    </div>,
    {
      ...size,
    },
  );
}
