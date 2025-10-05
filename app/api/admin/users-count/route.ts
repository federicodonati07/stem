import { NextResponse } from "next/server";

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

    const url = `${endpoint.replace(/\/$/, "")}/users?limit=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
        "Content-Type": "application/json",
      },
      // Force server side fetch
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
    const total = typeof data?.total === "number" ? data.total : 0;

    return NextResponse.json({ total });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
