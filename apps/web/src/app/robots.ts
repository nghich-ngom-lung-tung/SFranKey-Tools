import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { if (process.env.NEXT_PUBLIC_PREVIEW === "true") return { rules: { userAgent: "*", disallow: "/" } }; const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sfrankey.bond"; return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: `${siteUrl}/sitemap.xml` }; }
