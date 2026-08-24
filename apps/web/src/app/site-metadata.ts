import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "SFranKey – Free Security & Developer Tools", template: "%s | SFranKey" },
  description: "Privacy-aware security, developer and network diagnostic tools with explicit data boundaries.",
  applicationName: "SFranKey Tools",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: { languages: { vi: "/vi", en: "/en", "x-default": "/vi" } },
  openGraph: {
    type: "website",
    siteName: "SFranKey",
    title: "SFranKey – Free Security & Developer Tools",
    description: "Security, developer and network tools with clear privacy boundaries.",
    images: [{ url: "/brand-banner.jpg", width: 1200, height: 630, alt: "SFranKey Tools" }],
  },
};
