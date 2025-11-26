import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!
);

export async function GET() {
  try {
    // Count total users using auth.admin.listUsers()
    const { count, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      console.error("Error fetching users count:", error);
      return NextResponse.json(
        { error: "Failed to fetch users", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ total: count || 0 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
