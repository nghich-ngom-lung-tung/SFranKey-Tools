import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "SFranKey – Free Security & Developer Tools", template: "%s | SFranKey" },
  description: "Free privacy-first tools for 2FA, passwords, QR codes, hashing, JSON and everyday development tasks.",
  applicationName: "SFranKey Tools",
  alternates: { languages: { vi: "/vi", en: "/en", "x-default": "/vi" } },
  openGraph: { type: "website", siteName: "SFranKey", title: "SFranKey – Free Security & Developer Tools", description: "Private-first tools for security and development." }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return <html lang="vi" suppressHydrationWarning><body>{children}{plausibleDomain ? <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" /> : null}</body></html>;
}
