import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB;
    const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB;
    if (!endpoint || !projectId || !apiKey || !dbId || !productsCol) {
      return NextResponse.json(
        { error: "Missing Appwrite configuration" },
        { status: 500 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const dec: Record<string, number> = body?.dec || {};
    const uuids = Object.keys(dec).filter((u) => u);
    if (uuids.length === 0) return NextResponse.json({ ok: true, updated: 0 });

    const base = endpoint.replace(/\/$/, "");
    let updated = 0;
    for (const u of uuids) {
      try {
        // Fetch product by uuid (limit 1)
        const query = encodeURIComponent(`equal(\"uuid\", [\"${u}\"])`);
        const listUrl = `${base}/databases/${dbId}/collections/${productsCol}/documents?queries[]=${query}&limit=1`;
        const listRes = await fetch(listUrl, {
          method: "GET",
          headers: {
            "X-Appwrite-Project": projectId,
            "X-Appwrite-Key": apiKey,
          },
          cache: "no-store",
        });
        if (!listRes.ok) continue;
        const data = await listRes.json();
        const doc = Array.isArray(data?.documents) && data.documents[0];
        if (!doc) continue;
        const current = Number(doc.stock || 0);
        const delta = Number(dec[u] || 0);
        if (!Number.isFinite(current) || !Number.isFinite(delta) || delta <= 0)
          continue;
        const next = Math.max(0, current - delta);
        if (next === current) continue;
        const upRes = await fetch(
          `${base}/databases/${dbId}/collections/${productsCol}/documents/${doc.$id}`,
          {
            method: "PATCH",
            headers: {
              "X-Appwrite-Project": projectId,
              "X-Appwrite-Key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ stock: next }),
          }
        );
        if (upRes.ok) updated += 1;
      } catch {}
    }
    return NextResponse.json({ ok: true, updated, processed: uuids.length });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
