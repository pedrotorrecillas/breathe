import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Breathe",
  description: "Recruiter and candidate surfaces for the Breathe hiring flow.",
};

const locale = "en";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={locale} className="h-full scroll-smooth">
      <body className="bg-background text-foreground flex min-h-full flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
