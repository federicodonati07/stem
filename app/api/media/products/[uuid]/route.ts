import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: { uuid: string } }
) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_STORAGE;
  const apiKey =
    process.env.NEXT_APPWRITE_API_KEY ||
    process.env.APPWRITE_API_KEY ||
    process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

  if (!endpoint || !projectId || !bucketId) {
    return new NextResponse("Missing Appwrite config", { status: 500 });
  }
  try {
    const base = endpoint.replace(/\/$/, "");
    const url = `${base}/storage/buckets/${bucketId}/files/${context.params.uuid}/view`;
    const headers: Record<string, string> = { "X-Appwrite-Project": projectId };
    if (apiKey) headers["X-Appwrite-Key"] = apiKey;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      console.error("media proxy error", res.status, context.params.uuid);
      return new NextResponse("Not found", { status: 404 });
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
        Vary: "*",
      },
    });
  } catch (e) {
    console.error("media proxy server error", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
