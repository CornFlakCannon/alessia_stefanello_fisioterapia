import type { MetadataRoute } from "next";
import { SITE_URL } from "./site/seo";

export const dynamic = "force-static";

/** No `lastModified`: Google only trusts it when it is consistently accurate, and a build
 *  date would change on every deploy whether the page did or not. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }, { url: `${SITE_URL}/privacy` }];
}
