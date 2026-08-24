import { GeistMono, GeistSans } from "geist/font";
import { siteMetadata } from "../site-metadata";
import "../globals.css";

export const metadata = siteMetadata;

export default function RedirectRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
