import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Keep the live preview and production build isolated. Running `next build`
  // beside `next dev` otherwise replaces manifests and vendor chunks mid-session.
  distDir: process.env.NEXT_OUTPUT_DIR || ".next-build",
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
