interface Aircraft {
  name: string;
  category: string;
  maxPax?: number | null;
  rangeNm?: number | null;
  image?: string | null;
}

interface EmptyLeg {
  departureCity: string;
  arrivalCity: string;
  departureDateTime: Date | string;
  aircraft: {
    name: string;
    image?: string | null;
  };
  priceUsd?: number | null;
  source?: "ADMIN" | "OPERATOR" | "INSTACHARTER";
  operatorName?: string | null;
  aircraftName?: string | null;
  aircraftType?: string | null;
}

interface StructuredDataProps {
  type: "organization" | "website" | "aircraft" | "empty-leg" | "service";
  data?: {
    aircraft?: Aircraft;
    emptyLeg?: EmptyLeg;
    pageTitle?: string;
    pageDescription?: string;
    pageUrl?: string;
  };
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = "https://pexjet.com";

  const getStructuredData = () => {
    switch (type) {
      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PexJet - Perspective Executive Jets Limited",
          alternateName: "PexJet",
          url: baseUrl,
          logo: "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764942221/black-gold_1_k94z9u.png",
          description:
            "Nigeria's premier private jet charter company providing luxury air travel, empty leg flights, and aircraft management services.",
          foundingDate: "2005",
          address: {
            "@type": "PostalAddress",
            streetAddress:
              "H8GG+Q7X, Dominion Hangar Murtala Mohammed International Airport",
            addressLocality: "Lagos",
            addressCountry: "NG",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+234 818 211 3089",
            contactType: "customer service",
            availableLanguage: ["en"],
          },
          sameAs: [
            "https://facebook.com/pexjet",
            "https://twitter.com/pexjet",
            "https://instagram.com/pexjet",
            "https://linkedin.com/company/pexjet",
          ],
          areaServed: {
            "@type": "Country",
            name: [
              "Nigeria",
              "Ghana",
              "South Africa",
              "Kenya",
              "United Arab Emirates",
              "United Kingdom",
              "United States",
            ],
          },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Private Aviation Services",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Private Jet Charter",
                  description: "Luxury private jet charter services worldwide",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Empty Leg Flights",
                  description: "Discounted one-way private jet flights",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Aircraft Management",
                  description: "Comprehensive aircraft management services",
                },
              },
            ],
          },
        };

      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PexJet",
          url: baseUrl,
          description:
            "Experience luxury private aviation with PexJet. Book private jet charters, discover exclusive empty leg deals with up to 75% savings, and travel across Africa and beyond in comfort and style.",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${baseUrl}/charter?from={search_term_string}&to={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
          publisher: {
            "@type": "Organization",
            name: "PexJet",
            url: baseUrl,
          },
        };

      case "aircraft":
        if (!data?.aircraft) return null;

        return {
          "@context": "https://schema.org",
          "@type": "Product",
          name: data.aircraft.name,
          description: `${data.aircraft.name} ${data.aircraft.category} private jet available for charter. Luxury air travel with premium amenities.`,
          image: data.aircraft.image || [],
          brand: {
            "@type": "Brand",
            name: "PexJet",
          },
          category: data.aircraft.category,
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: "USD",
            },
            seller: {
              "@type": "Organization",
              name: "PexJet",
              url: baseUrl,
            },
          },
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Passenger Capacity",
              value: data.aircraft.maxPax || "Multiple",
            },
            {
              "@type": "PropertyValue",
              name: "Range",
              value: data.aircraft.rangeNm
                ? `${data.aircraft.rangeNm} nm`
                : "Long range",
            },
          ],
        };

      case "empty-leg":
        if (!data?.emptyLeg) return null;

        const departureDate = new Date(
          data.emptyLeg.departureDateTime,
        ).toISOString();
        const source = data.emptyLeg.source || "ADMIN";

        return {
          "@context": "https://schema.org",
          "@type": "Flight",
          flightNumber: `EMPTY-${data.emptyLeg.departureCity}-${data.emptyLeg.arrivalCity}`,
          departureAirport: {
            "@type": "Airport",
            name: data.emptyLeg.departureCity,
          },
          arrivalAirport: {
            "@type": "Airport",
            name: data.emptyLeg.arrivalCity,
          },
          departureTime: departureDate,
          aircraft: {
            "@type": "Vehicle",
            name: data.emptyLeg.aircraft.name,
            image: data.emptyLeg.aircraft.image || [],
          },
          offers: {
            "@type": "Offer",
            url: data.pageUrl,
            price: data.emptyLeg.priceUsd || "Contact for price",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            description: `${source === "INSTACHARTER" ? "Verified partner" : source === "ADMIN" ? "PexJet exclusive" : "Operator"} empty leg flight from ${data.emptyLeg.departureCity} to ${data.emptyLeg.arrivalCity}. Save up to 75% on private jet travel.`,
            seller: {
              "@type": "Organization",
              name:
                source === "INSTACHARTER"
                  ? "Verified Partner"
                  : source === "ADMIN"
                    ? "PexJet"
                    : data.emptyLeg.operatorName || "Certified Operator",
              url: baseUrl,
            },
          },
          provider: {
            "@type": "Organization",
            name: "PexJet",
            url: baseUrl,
          },
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Flight Type",
              value: "Empty Leg Flight",
            },
            {
              "@type": "PropertyValue",
              name: "Source",
              value:
                source === "INSTACHARTER"
                  ? "Verified Partner"
                  : source === "ADMIN"
                    ? "PexJet Exclusive"
                    : "Operator Direct",
            },
            {
              "@type": "PropertyValue",
              name: "Savings",
              value: "Up to 75%",
            },
          ],
        };

      case "service":
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          name: data?.pageTitle || "Private Aviation Services",
          description:
            data?.pageDescription ||
            "Comprehensive private aviation solutions including jet charter, empty leg flights, and aircraft management.",
          provider: {
            "@type": "Organization",
            name: "PexJet",
            url: baseUrl,
          },
          areaServed: "Worldwide",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Private Aviation Services",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Private Jet Charter",
                  description: "Luxury private jet charter services worldwide",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Empty Leg Flights",
                  description: "Discounted one-way private jet flights",
                },
              },
            ],
          },
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
