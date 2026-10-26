import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Quicksand } from "next/font/google";
import "./globals.css";
import { CONTACT } from "./site/data";
import { DESCRIPTION, SITE_URL, STRUCTURED_DATA, TITLE } from "./site/seo";

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

/* Everything search engines and link previews read lives in site/seo.ts. The preview image
   and the icons are app/opengraph-image.jpg, icon.png, apple-icon.png and favicon.ico,
   which Next turns into tags by itself. */
export const metadata: Metadata = {
  // The ORIGIN, not SITE_URL: Next already prefixes the base path to the preview image's
  // URL, and a base path here as well doubles it (/repo/repo/opengraph-image.jpg). So the
  // canonical URLs below are written out in full.
  metadataBase: new URL(new URL(SITE_URL).origin),
  title: TITLE,
  description: DESCRIPTION,
  // Inherited by every page: /privacy sets its own, or it would declare itself a copy of /.
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: CONTACT.name,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
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
      <body className="min-h-full">
        <script
          type="application/ld+json"
          // `<` escaped so no string in the data can ever close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
