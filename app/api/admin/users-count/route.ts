import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!
);

export async function GET() {
  try {
    // Count total users by fetching all pages
    let totalUsers = 0;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("Error fetching users count:", error);
        return NextResponse.json(
          { error: "Failed to fetch users", details: error.message },
          { status: 500 }
        );
      }

      if (!data || !data.users || data.users.length === 0) break;

      totalUsers += data.users.length;

      // If we got less than perPage, we've reached the end
      if (data.users.length < perPage) break;

      page++;

      // Safety limit: max 10 pages (10000 users)
      if (page > 10) break;
    }

    console.log(`[users-count] Total users counted: ${totalUsers}`);
    return NextResponse.json({ total: totalUsers });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
