import { NextResponse } from "next/server";

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET() {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey =
      process.env.NEXT_APPWRITE_API_KEY ||
      process.env.APPWRITE_API_KEY ||
      process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json(
        { error: "Missing Appwrite configuration" },
        { status: 500 }
      );
    }

    // Fetch up to 1000 users (no ordering to avoid 400)
    const base = endpoint.replace(/\/$/, "");
    const url = new URL(`${base}/users`);
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch users", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const users: Array<{ $createdAt?: string }> = Array.isArray(data?.users)
      ? data.users
      : [];

    // Build day buckets for last 60 days
    const today = new Date();
    const days = 60;
    const map: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      map[formatDate(d)] = 0;
    }

    for (const u of users) {
      const created = u.$createdAt ? new Date(u.$createdAt) : null;
      if (!created) continue;
      const key = formatDate(created);
      if (key in map) map[key] += 1;
    }

    // Produce ordered series oldest -> newest for last 60 days
    const keys = Object.keys(map).sort();
    const series60 = keys.map((k) => ({ date: k, count: map[k] }));

    const last30 = series60.slice(-30);
    const prev30 = series60.slice(-60, -30);

    const sum = (arr: { count: number }[]) =>
      arr.reduce((a, b) => a + b.count, 0);
    const currentTotal = sum(last30);
    const prevTotal = sum(prev30);
    const growthPct =
      prevTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : ((currentTotal - prevTotal) / prevTotal) * 100;

    return NextResponse.json({
      series: last30,
      currentTotal,
      prevTotal,
      growthPct,
    });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
