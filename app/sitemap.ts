import type { MetadataRoute } from "next";
import { docs, operator, platformDocs } from "@/lib/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-14");
  return [
    {
      url: operator.sites[0],
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docs.map((doc) => ({
      url: `${operator.sites[0]}/legal/${doc.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...platformDocs.map((doc) => ({
      url: `${operator.sites[0]}/legal/${doc.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
