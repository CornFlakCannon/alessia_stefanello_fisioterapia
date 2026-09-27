/**
 * Where the site is mounted.
 *
 * On GitHub Pages without a custom domain the site lives under
 * `https://<user>.github.io/<repo>/`, and every absolute URL the page writes by hand —
 * the photo manifest, the Olimpiadi JPEG — would otherwise resolve against the domain
 * root and 404. Next prefixes its own `_next/` assets with `basePath` on its own, but it
 * does NOT touch a `src` string you pass to `next/image` or a `<picture>` source, so the
 * prefix has to be applied where those strings are written.
 *
 * `NEXT_PUBLIC_BASE_PATH` is set by the deploy workflow (empty once a custom domain is in
 * place, `/<repo>` before that) and read by `next.config.ts` for the same value, so the
 * two can never disagree. Locally it is unset and `asset()` is the identity.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a root-relative public URL (`/foto/x.webp`) with the mount point. */
export const asset = (path: `/${string}`): string => `${BASE_PATH}${path}`;
