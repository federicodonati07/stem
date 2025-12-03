import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
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
    // Fetch all users from Supabase Auth
    let allUsers: Array<{ created_at?: string }> = [];
    let page = 1;
    const perPage = 1000;

    console.log("[users-stats] Starting to fetch users...");

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("[users-stats] Error fetching users:", error);
        break;
      }

      if (!data || !data.users || data.users.length === 0) break;

      allUsers = allUsers.concat(
        data.users.map((u) => ({ created_at: u.created_at }))
      );

      console.log(`[users-stats] Fetched page ${page}, ${data.users.length} users`);

      // If we got less than perPage, we've reached the end
      if (data.users.length < perPage) break;

      page++;

      // Safety limit: max 10 pages (10000 users)
      if (page > 10) break;
    }

    console.log(`[users-stats] Total users fetched: ${allUsers.length}`);

    // Build day buckets for last 60 days
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const days = 60;
    const map: Record<string, number> = {};
    
    // Initialize all 60 days to 0
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      map[formatDate(d)] = 0;
    }

    // Count registrations per day
    for (const u of allUsers) {
      const created = u.created_at ? new Date(u.created_at) : null;
      if (!created) continue;
      const key = formatDate(created);
      if (key in map) {
        map[key] += 1;
      }
    }

    // Produce ordered series oldest -> newest for last 60 days
    const keys = Object.keys(map).sort();
    const dailyRegistrations = keys.map((k) => ({ date: k, count: map[k] }));

    // Calculate cumulative totals
    let cumulativeTotal = 0;
    const series60 = dailyRegistrations.map((item) => {
      cumulativeTotal += item.count;
      return { date: item.date, count: cumulativeTotal };
    });

    console.log(`[users-stats] Series data points: ${series60.length}`);

    const last30 = series60.slice(-30);
    const prev30 = series60.slice(-60, -30);

    // For cumulative data, compare the final values of each period
    const currentTotal = last30.length > 0 ? last30[last30.length - 1].count : 0;
    const prevTotal = prev30.length > 0 ? prev30[prev30.length - 1].count : 0;
    const growthPct =
      prevTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : ((currentTotal - prevTotal) / prevTotal) * 100;

    console.log(`[users-stats] Current: ${currentTotal}, Previous: ${prevTotal}, Growth: ${growthPct.toFixed(1)}%`);

    return NextResponse.json({
      series: last30,
      currentTotal,
      prevTotal,
      growthPct,
    });
  } catch (err) {
    console.error("[users-stats] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
