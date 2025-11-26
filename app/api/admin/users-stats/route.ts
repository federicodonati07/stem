import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!
);

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET() {
  try {
    // Fetch users (Supabase auth admin API doesn't support large pagination easily)
    // For now, fetch up to 1000 users (adjust perPage as needed)
    let allUsers: Array<{ created_at?: string }> = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("Error fetching users:", error);
        break;
      }

      if (!data || !data.users || data.users.length === 0) break;

      allUsers = allUsers.concat(
        data.users.map((u) => ({ created_at: u.created_at }))
      );

      // If we got less than perPage, we've reached the end
      if (data.users.length < perPage) break;

      page++;

      // Safety limit: max 10 pages (10000 users)
      if (page > 10) break;
    }

    // Build day buckets for last 60 days
    const today = new Date();
    const days = 60;
    const map: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      map[formatDate(d)] = 0;
    }

    for (const u of allUsers) {
      const created = u.created_at ? new Date(u.created_at) : null;
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
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
