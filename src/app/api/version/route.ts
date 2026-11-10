export const dynamic = "force-dynamic";

/** The version the server is running now. Compared with the build the browser has loaded. */
export function GET() {
  const build = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || "dev").slice(0, 7);
  return Response.json({ build }, { headers: { "cache-control": "no-store" } });
}
