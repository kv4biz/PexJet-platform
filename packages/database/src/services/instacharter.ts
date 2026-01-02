// InstaCharter API interfaces
export interface InstaCharterLocation {
  dateFrom: string;
  fromIcao: string;
  fromCity: string;
  lat: number;
  long: number;
}

export interface InstaCharterLocationTo {
  dateTo: string;
  toIcao: string;
  toCity: string;
  lat: number;
  long: number;
}

export interface InstaCharterAircraft {
  aircraft_Category: string;
  aircraft_Type: string;
  availabilityType: string;
  seats: number;
  price: string;
}

export interface InstaCharterCompanyDetails {
  id: number;
  companyName: string;
  email: string;
  phone: string;
}

export interface InstaCharterAvailability {
  id: number;
  from: InstaCharterLocation;
  to: InstaCharterLocationTo;
  aircraft: InstaCharterAircraft;
  companyDetails: InstaCharterCompanyDetails;
  aircraftImage?: string;
}

export interface InstaCharterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: InstaCharterAvailability[];
}

export interface SyncResult {
  totalProcessed: number;
  newDeals: number;
  updatedDeals: number;
  skippedDeals: number;
  errors: string[];
}

export class InstaCharterService {
  private apiKey: string;
  private baseUrl: string = "https://server.instacharter.app/api/Markets";
  private imageCache: Map<string, string> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch availabilities from InstaCharter API
   */
  async fetchAvailabilities(
    pageNo: number = 1,
  ): Promise<InstaCharterAvailability[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/GetAvailabilities?PageNo=${pageNo}`,
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            "X-Api-Key": this.apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: InstaCharterResponse = await response.json();

      if (!result.success) {
        throw new Error(`API returned error: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      console.error(`Failed to fetch page ${pageNo}:`, error);
      throw error;
    }
  }

  /**
   * Fetch aircraft image using GetOptions API
   */
  async fetchAircraftImage(
    deal: InstaCharterAvailability,
  ): Promise<string | null> {
    const aircraftType = deal.aircraft.aircraft_Type;

    // Check cache first
    if (this.imageCache.has(aircraftType)) {
      return this.imageCache.get(aircraftType)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/GetOptions`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "X-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: "USD",
          clientId: this.apiKey,
          itinerary: [
            {
              from: {
                lat: deal.from.lat || 0,
                long: deal.from.long || 0,
                name: deal.from.fromCity || "Origin",
              },
              to: {
                lat: deal.to.lat || 0,
                long: deal.to.long || 0,
                name: deal.to.toCity || "Destination",
              },
              date:
                deal.from.dateFrom?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              pax: deal.aircraft.seats || 4,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.warn(
          `Failed to fetch aircraft image for ${aircraftType}: ${response.status}`,
        );
        return null;
      }

      const data = await response.json();

      if (data.success && data.data?.base) {
        // Find matching aircraft image
        let imageUrl = null;

        for (const category of data.data.base) {
          if (category.aircraftDetails) {
            // Try exact match first
            const exactMatch = category.aircraftDetails.find(
              (a: any) =>
                a.aircraftName?.toLowerCase() === aircraftType?.toLowerCase(),
            );

            if (exactMatch?.image) {
              imageUrl = exactMatch.image;
              break;
            }

            // Try partial match
            const partialMatch = category.aircraftDetails.find((a: any) =>
              aircraftType
                ?.toLowerCase()
                .includes(a.aircraftName?.toLowerCase().split(" ")[0]),
            );

            if (partialMatch?.image) {
              imageUrl = partialMatch.image;
              break;
            }

            // Use category match
            if (
              category.aircraftCategory?.toLowerCase() ===
              deal.aircraft.aircraft_Category?.toLowerCase()
            ) {
              imageUrl = category.aircraftDetails[0]?.image;
              break;
            }
          }
        }

        // Fallback to first available image
        if (!imageUrl && data.data.base[0]?.aircraftDetails?.[0]?.image) {
          imageUrl = data.data.base[0].aircraftDetails[0].image;
        }

        if (imageUrl) {
          this.imageCache.set(aircraftType, imageUrl);
          return imageUrl;
        }
      }
    } catch (error) {
      console.warn(`Error fetching aircraft image for ${aircraftType}:`, error);
    }

    return null;
  }

  /**
   * Fetch all availabilities with images
   */
  async fetchAllAvailabilities(): Promise<InstaCharterAvailability[]> {
    const allDeals: InstaCharterAvailability[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const deals = await this.fetchAvailabilities(currentPage);

        if (deals.length === 0) {
          hasMore = false;
        } else {
          // Fetch images for each deal
          const dealsWithImages = await Promise.all(
            deals.map(async (deal) => {
              const image = await this.fetchAircraftImage(deal);
              return { ...deal, aircraftImage: image || undefined };
            }),
          );

          allDeals.push(...dealsWithImages);
          currentPage++;

          // Safety limit to prevent infinite loops
          if (currentPage > 100) {
            console.warn("Reached page limit of 100, stopping fetch");
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        hasMore = false;
      }
    }

    return allDeals;
  }

  /**
   * Filter deals based on criteria
   */
  filterDeals(deals: InstaCharterAvailability[]): InstaCharterAvailability[] {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    return deals.filter((deal) => {
      // Only one-way trips
      if (deal.aircraft.availabilityType !== "One Way") {
        return false;
      }

      // Within 6 months
      const departureDate = new Date(deal.from.dateFrom);
      if (departureDate > sixMonthsFromNow) {
        return false;
      }

      // Must have valid ICAO codes
      if (!deal.from.fromIcao || !deal.to.toIcao) {
        return false;
      }

      // Must have valid price
      if (!deal.aircraft.price) {
        return false;
      }

      return true;
    });
  }

  /**
   * Parse price string to number
   */
  parsePrice(priceStr: string): number | null {
    if (!priceStr) return null;

    // Remove currency symbols and commas
    const cleanPrice = priceStr.replace(/[$,\s]/g, "");

    // Handle K suffix (e.g., "26K" -> 26000)
    if (cleanPrice.endsWith("K")) {
      const number = parseFloat(cleanPrice.slice(0, -1));
      return number * 1000;
    }

    // Parse as regular number
    const parsed = parseFloat(cleanPrice);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Generate slug for empty leg
   */
  generateSlug(fromCity: string, toCity: string, id: number): string {
    // Clean city names and convert to lowercase
    const cleanFrom = fromCity
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 20);

    const cleanTo = toCity
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 20);

    return `${cleanFrom}-${cleanTo}-ic-${id}`;
  }

  /**
   * Transform InstaCharter deal to PexJet empty leg format
   */
  transformDeal(deal: InstaCharterAvailability) {
    const priceUsd = this.parsePrice(deal.aircraft.price);

    return {
      externalId: deal.id.toString(),
      slug: this.generateSlug(deal.from.fromCity, deal.to.toCity, deal.id),
      departureIcao: deal.from.fromIcao,
      departureCity: deal.from.fromCity,
      arrivalIcao: deal.to.toIcao,
      arrivalCity: deal.to.toCity,
      departureDateTime: new Date(deal.from.dateFrom),
      totalSeats: deal.aircraft.seats,
      availableSeats: deal.aircraft.seats,
      aircraftCategory: deal.aircraft.aircraft_Category,
      aircraftType: deal.aircraft.aircraft_Type,
      aircraftImage: deal.aircraftImage || null,
      priceType: "FIXED" as const,
      priceUsd,
      source: "INSTACHARTER" as const,
      operatorName: deal.companyDetails.companyName,
      operatorEmail: deal.companyDetails.email,
      operatorPhone: deal.companyDetails.phone,
      operatorCompanyId: deal.companyDetails.id,
      lastSyncedAt: new Date(),
    };
  }
}
