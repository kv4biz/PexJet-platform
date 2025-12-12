import { MetadataRoute } from "next";
import { prisma } from "@pexjet/database";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://pexjet.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/charter`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/empty-legs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/aircraft`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/our-company`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about/asset-acquisition-and-financing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic empty leg pages
  let emptyLegPages: MetadataRoute.Sitemap = [];
  try {
    const emptyLegs = await prisma.emptyLeg.findMany({
      where: {
        status: "PUBLISHED",
        departureDateTime: {
          gte: new Date(),
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    emptyLegPages = emptyLegs.map((leg) => ({
      url: `${baseUrl}/empty-legs/${leg.slug}`,
      lastModified: leg.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error fetching empty legs for sitemap:", error);
  }

  // Dynamic aircraft pages
  let aircraftPages: MetadataRoute.Sitemap = [];
  try {
    const aircraft = await prisma.aircraft.findMany({
      where: {
        availability: {
          in: ["LOCAL", "INTERNATIONAL", "BOTH"],
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    aircraftPages = aircraft.map((a) => ({
      url: `${baseUrl}/aircraft/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error fetching aircraft for sitemap:", error);
  }

  return [...staticPages, ...emptyLegPages, ...aircraftPages];
}
