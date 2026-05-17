import type { Metadata } from "next";
import { EB_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nacar.ai"),
  title: "Nacar | AI agents for faster high-volume hiring",
  description:
    "Nacar automates candidate operations between application and hire for high-volume recruiting teams.",
};

const locale = "en";

const headingFont = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  weight: ["400", "500", "600"],
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={locale} className="h-full scroll-smooth">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} bg-background text-foreground flex min-h-full flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
