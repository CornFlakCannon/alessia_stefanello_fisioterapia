import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BASE_PATH } from "./basePath";
import { CONTACT, LEGAL, SERVICES } from "./data";

/**
 * What the site tells search engines and link previews about itself. Build-time only — it
 * reads the filesystem — so only server files import it: layout.tsx, robots.ts, sitemap.ts.
 * The preview image and the icons are files in app/, built by scripts/seo-images.mjs.
 */

/** The site's absolute address, no trailing slash. `public/CNAME` holds the custom domain —
 *  the same file the deploy workflow tests to pick the base path — so committing it moves
 *  the canonical URL, the sitemap and the base path together. Without it the site is on
 *  GitHub's own address, under `/<repo>`. */
export const SITE_URL = (() => {
  try {
    return `https://${readFileSync(join(process.cwd(), "public", "CNAME"), "utf8").trim()}`;
  } catch {
    return `https://cornflakcannon.github.io${BASE_PATH}`;
  }
})();

/** The name to use everywhere the practice is listed — the Google Business Profile
 *  included: search engines match listings by name, address and phone. */
const NAME = `${CONTACT.name} — Fisioterapista`;

export const TITLE = `${CONTACT.name} — Fisioterapista a Padova`;
export const DESCRIPTION =
  "Fisioterapia muscoloscheletrica, sportiva e del pavimento pelvico a Padova, e a domicilio in zona centro. Solo su prenotazione.";

/** schema.org JSON-LD. `Physiotherapy` is a LocalBusiness subtype. Left out on purpose:
 *  `postalCode` (not confirmed yet — CLIENTE_TODO.md) and `geo` (the studio's only
 *  OpenStreetMap node is ~600 m off, see static-map.mjs; Google geocodes the address). */
export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: NAME,
      inLanguage: "it",
    },
    {
      "@type": "Physiotherapy",
      "@id": `${SITE_URL}/#studio`,
      name: NAME,
      description: DESCRIPTION,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/opengraph-image.jpg`,
      telephone: CONTACT.phoneDisplay,
      email: CONTACT.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: `${CONTACT.address.line1}, ${CONTACT.address.line2}`,
        addressLocality: CONTACT.address.locality,
        addressRegion: CONTACT.address.province,
        addressCountry: "IT",
      },
      areaServed: { "@type": "City", name: CONTACT.address.locality },
      vatID: `IT${LEGAL.piva}`,
      founder: { "@type": "Person", name: CONTACT.name, jobTitle: "Fisioterapista" },
      knowsAbout: [
        SERVICES.muscolo.title,
        SERVICES.sport.title,
        SERVICES.pelvico.title,
        SERVICES.domiciliare.title,
      ],
    },
  ],
};
