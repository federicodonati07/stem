import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
/* eslint-disable @typescript-eslint/no-explicit-any */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const PRODUCTS_STORAGE =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_STORAGE || "products";

export async function GET(_req: Request, context: any) {
  try {
    const uuid = String(context?.params?.uuid ?? context?.uuid ?? "");

    if (!uuid) {
      return new NextResponse("Missing UUID", { status: 400 });
    }

    // Try to download the file from Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from(PRODUCTS_STORAGE)
      .download(uuid);

    if (error || !data) {
      console.error("media proxy error", error, uuid);
      return new NextResponse("Not found", { status: 404 });
    }

    // Get content type from blob
    const contentType = data.type || "image/png";
    const buf = await data.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (e) {
    console.error("media proxy server error", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
