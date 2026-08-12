import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Keep the live preview and production build isolated. Running `next build`
  // beside `next dev` otherwise replaces manifests and vendor chunks mid-session.
  // Vercel's build system expects the conventional ".next" output, so skip the
  // isolation there — it only matters for a local dev + build running side by side.
  distDir: process.env.VERCEL ? ".next" : (process.env.NEXT_OUTPUT_DIR || ".next-build"),
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
