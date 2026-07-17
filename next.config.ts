import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
