import type { NextConfig } from "next";

// Build id baked into the browser code, so an open app can tell when a newer version is live.
const BUILD = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || "dev").slice(0, 7);

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD: BUILD },
};

export default nextConfig;
