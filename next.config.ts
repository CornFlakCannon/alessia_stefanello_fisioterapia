import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Static export: the site is a single page with no server side (form is a mailto:,
     map is an iframe), so `next build` writes plain HTML+assets to `out/`, which GitHub
     Pages serves as-is. See DEPLOY_GITHUB_PAGES.md. */
  output: "export",
  /* No image optimizer on a static host. Costs nothing here: every photo is already a
     hand-cropped WebP at its display size (scripts/crop-photos.mjs). */
  images: { unoptimized: true },
  /* Mount point — `/<repo>` on <user>.github.io before the custom domain, "" after.
     Set by the deploy workflow; app/site/basePath.ts reads the same variable for the
     hand-written asset URLs. */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  /* Pin the Turbopack workspace root to THIS project. Without it, the stray
     /home/matti/package-lock.json (plus a sibling "my_artisia" checkout) makes
     Turbopack infer /home/matti as the root and resolve modules from the wrong
     project — which surfaced as a spurious global-error page. */
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Offload Turbopack's dev compile cache to disk instead of holding it all in
    // RAM — the 16.1/16.2 precursor to 16.3's default memory eviction. Cuts the
    // dev server's resident memory on this small app. (TEST — verifying on stable.)
    turbopackFileSystemCacheForDev: true,
  },
  allowedDevOrigins: ['192.168.1.116']
};

export default nextConfig;
