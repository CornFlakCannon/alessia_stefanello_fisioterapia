import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Quicksand } from "next/font/google";
import "./globals.css";

// and a mono for eyebrows / labels. All variable fonts, self-hosted by Next.

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// Rounded, friendly sans for the contact data (footer table).
const contact = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Alessia Stefanello — Fisioterapista a Padova",
  description:
    "Fisioterapia muscoloscheletrica, sportiva e del pavimento pelvico a Padova, e a domicilio in zona centro. Solo su prenotazione.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      // opt back into Next's smooth-scroll override (v16 no longer does this by default)
      data-scroll-behavior="smooth"
      data-palette="a"
      className={`h-full ${display.variable} ${sans.variable} ${mono.variable} ${contact.variable} antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
