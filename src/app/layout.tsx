import type { Metadata } from "next";
import { Archivo_Black, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

export const metadata: Metadata = {
  title: "Breathe",
  description: "Recruiter and candidate surfaces for the Breathe hiring flow.",
};

const locale = "en";

const headingFont = Archivo_Black({
  subsets: ["latin"],
  variable: "--font-archivo-black",
  weight: "400",
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
        className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} bg-background text-foreground flex min-h-full flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
