import type { MetadataRoute } from "next";

const siteUrl = "https://www.omareladawymathigcse.com";

const publicRoutes = ["", "/about", "/courses", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
