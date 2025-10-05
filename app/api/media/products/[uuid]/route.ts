import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_STORAGE;

  if (!endpoint || !projectId || !bucketId) {
    return new NextResponse("Missing Appwrite config", { status: 500 });
  }
  try {
    const base = endpoint.replace(/\/$/, "");
    const url = `${base}/storage/buckets/${bucketId}/files/${params.uuid}/view`;
    const res = await fetch(url, {
      headers: {
        "X-Appwrite-Project": projectId,
      },
      cache: "no-store",
    });
    if (!res.ok) {
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
  } catch {
    return new NextResponse("Server error", { status: 500 });
  }
}
