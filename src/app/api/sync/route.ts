import { NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Cloud copy for cross-device sync, stored in Vercel Blob.
 * The id is SHA-256 of the student's private sync code (hashed in the browser),
 * so the server never sees the code itself. Bodies are gzip-compressed JSON.
 * Needs BLOB_READ_WRITE_TOKEN, which Vercel adds when a Blob store is connected.
 * For running on your own computer, SYNC_LOCAL_DIR=./.sync stores the copies in a folder instead.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024; // Vercel's request body limit is 4.5 MB
const ACCESS = (process.env.SYNC_BLOB_ACCESS === "public" ? "public" : "private") as "public" | "private";

const LOCAL = process.env.SYNC_LOCAL_DIR;

function check(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !LOCAL) return { error: NextResponse.json({ error: "Sync storage is not configured." }, { status: 503 }) };
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[a-f0-9]{64}$/.test(id)) return { error: NextResponse.json({ error: "Bad id" }, { status: 400 }) };
  return { path: `sync/${id}.json.gz` };
}

export async function GET(req: Request) {
  const c = check(req);
  if (c.error) return c.error;
  if (LOCAL) {
    const data = await fs.readFile(path.join(LOCAL, c.path.replace("/", "_"))).catch(() => null);
    return data ? new Response(new Uint8Array(data), { headers: { "content-type": "application/gzip", "cache-control": "no-store" } }) : new Response(null, { status: 404 });
  }
  try {
    const r = await get(c.path, { access: ACCESS, useCache: false });
    if (!r) return new Response(null, { status: 404 });
    return new Response(r.stream, { headers: { "content-type": "application/gzip", "cache-control": "no-store" } });
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (/not found|does not exist/i.test(msg)) return new Response(null, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const c = check(req);
  if (c.error) return c.error;
  const body = new Uint8Array(await req.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX) return NextResponse.json({ error: "Backup is empty or too large." }, { status: 413 });
  if (body[0] !== 0x1f || body[1] !== 0x8b) return NextResponse.json({ error: "Expected gzip data." }, { status: 400 });
  if (LOCAL) {
    await fs.mkdir(LOCAL, { recursive: true });
    await fs.writeFile(path.join(LOCAL, c.path.replace("/", "_")), body);
    return NextResponse.json({ ok: true, bytes: body.byteLength });
  }
  try {
    await put(c.path, Buffer.from(body), { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType: "application/gzip", cacheControlMaxAge: 60 });
    return NextResponse.json({ ok: true, bytes: body.byteLength });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
