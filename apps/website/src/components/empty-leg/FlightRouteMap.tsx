"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface Airport {
  code: string;
  name?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface FlightRouteMapProps {
  departureAirport: Airport;
  arrivalAirport: Airport;
  className?: string;
}

export function FlightRouteMap({
  departureAirport,
  arrivalAirport,
  className = "",
}: FlightRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Check if we have valid coordinates (must be numbers)
    const hasValidCoords =
      typeof departureAirport.latitude === "number" &&
      typeof departureAirport.longitude === "number" &&
      typeof arrivalAirport.latitude === "number" &&
      typeof arrivalAirport.longitude === "number" &&
      !isNaN(departureAirport.latitude) &&
      !isNaN(departureAirport.longitude) &&
      !isNaN(arrivalAirport.latitude) &&
      !isNaN(arrivalAirport.longitude);

    if (!hasValidCoords) {
      setError("Route map not available for this deal");
      setIsLoading(false);
      return;
    }

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        // Check if still mounted
        if (!isMountedRef.current) return;

        // Import Leaflet
        const L = (await import("leaflet")).default;

        // Check if still mounted after async import
        if (!isMountedRef.current) return;

        // Inject Leaflet CSS if not already present
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.integrity =
            "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          link.crossOrigin = "";
          document.head.appendChild(link);
          // Wait for CSS to load
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Check if still mounted after CSS load
        if (!isMountedRef.current) return;

        if (!mapRef.current) {
          setError("Map container not found");
          setIsLoading(false);
          return;
        }

        // Ensure container has dimensions before initializing map
        const containerRect = mapRef.current.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) {
          setError("Map container has no dimensions");
          setIsLoading(false);
          return;
        }

        // If map already exists, clean it up first
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
          } catch (e) {
            // Ignore cleanup errors
          }
          mapInstanceRef.current = null;
        }

        const depLat = departureAirport.latitude!;
        const depLng = departureAirport.longitude!;
        const arrLat = arrivalAirport.latitude!;
        const arrLng = arrivalAirport.longitude!;

        // Calculate center point
        const centerLat = (depLat + arrLat) / 2;
        const centerLng = (depLng + arrLng) / 2;

        // Create map
        const map = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: 4,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        // Add dark tile layer for sleek look
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
          },
        ).addTo(map);

        // Custom gold marker icon (no border)
        const goldIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: 16px;
              height: 16px;
              background: #D4AF37;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(212,175,55,0.5);
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        // Add departure marker with tooltip
        const depMarker = L.marker([depLat, depLng], { icon: goldIcon }).addTo(
          map,
        );
        depMarker.bindTooltip(
          `<div style="text-align: center; font-family: system-ui; padding: 4px;">
            <strong style="color: #D4AF37;">${departureAirport.name || departureAirport.code}</strong><br/>
            <span style="font-size: 12px;">${departureAirport.city}, ${departureAirport.country}</span>
          </div>`,
          { permanent: false, direction: "top", offset: [0, -10] },
        );

        // Add arrival marker with tooltip
        const arrMarker = L.marker([arrLat, arrLng], { icon: goldIcon }).addTo(
          map,
        );
        arrMarker.bindTooltip(
          `<div style="text-align: center; font-family: system-ui; padding: 4px;">
            <strong style="color: #D4AF37;">${arrivalAirport.name || arrivalAirport.code}</strong><br/>
            <span style="font-size: 12px;">${arrivalAirport.city}, ${arrivalAirport.country}</span>
          </div>`,
          { permanent: false, direction: "top", offset: [0, -10] },
        );

        // Create curved flight path (great circle approximation)
        const curvePoints = generateCurvedPath(depLat, depLng, arrLat, arrLng);

        // Draw the flight path with gold color
        const flightPath = L.polyline(curvePoints, {
          color: "#D4AF37",
          weight: 3,
          opacity: 0.8,
          dashArray: "10, 10",
        }).addTo(map);

        // Plane icon removed as per user request

        // Fit bounds to show both markers with padding
        const bounds = L.latLngBounds([
          [depLat, depLng],
          [arrLat, arrLng],
        ]);

        // Use setTimeout to ensure map is fully initialized before fitBounds
        setTimeout(() => {
          if (isMountedRef.current && mapInstanceRef.current) {
            try {
              map.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) {
              console.error("Error fitting bounds:", e);
            }
          }
        }, 100);

        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Map initialization error:", err);
        setError(err?.message || "Failed to load map");
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initMap();
      }
    }, 150);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors - map may already be destroyed
        }
        mapInstanceRef.current = null;
      }
    };
  }, [departureAirport, arrivalAirport]);

  // Generate curved path points for great circle route
  function generateCurvedPath(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): [number, number][] {
    const points: [number, number][] = [];
    const numPoints = 50;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;

      // Simple curved interpolation with slight arc
      const lat = lat1 + (lat2 - lat1) * t;
      const lng = lng1 + (lng2 - lng1) * t;

      // Add curvature based on distance
      const distance = Math.sqrt(
        Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2),
      );
      const curveHeight = distance * 0.1;
      const curve = Math.sin(t * Math.PI) * curveHeight;

      // Apply curve perpendicular to the route
      const perpLat = -(lng2 - lng1) / distance;
      const perpLng = (lat2 - lat1) / distance;

      points.push([lat + perpLat * curve, lng + perpLng * curve]);
    }

    return points;
  }

  // Calculate bearing between two points
  function calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 90 + 360) % 360; // Adjust for plane icon orientation
  }

  if (error) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center ${className}`}
        style={{ minHeight: "300px" }}
      >
        <div className="text-center text-gray-300 p-8">
          <div className="text-6xl mb-4">✈️</div>
          <p className="text-lg font-semibold mb-2">Flight Route</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>

          {/* Show route information as fallback */}
          <div className="bg-black/30 rounded-lg p-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[#D4AF37] font-bold text-lg">
                  {departureAirport.code}
                </div>
                <div className="text-sm text-gray-400">
                  {departureAirport.city}, {departureAirport.country}
                </div>
              </div>
              <div className="text-gray-500">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-[#D4AF37] font-bold text-lg">
                  {arrivalAirport.code}
                </div>
                <div className="text-sm text-gray-400">
                  {arrivalAirport.city}, {arrivalAirport.country}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: "300px" }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: "300px", background: "#1a1a2e" }}
      />
      {/* Route info overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm px-3 py-2 text-white text-sm">
          <span className="text-[#D4AF37] font-bold">
            {departureAirport.code}
          </span>
          <span className="text-gray-400 ml-1">{departureAirport.city}</span>
        </div>
        <div className="bg-black/70 backdrop-blur-sm px-3 py-2 text-white text-sm">
          <span className="text-[#D4AF37] font-bold">
            {arrivalAirport.code}
          </span>
          <span className="text-gray-400 ml-1">{arrivalAirport.city}</span>
        </div>
      </div>
    </div>
  );
}
