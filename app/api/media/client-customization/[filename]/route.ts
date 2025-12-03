import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_CUSTOMIZATION_STORAGE =
  process.env.NEXT_PUBLIC_SUPABASE_CLIENT_CUSTOMIZATION_STORAGE || "client_customization";

export async function GET(_req: Request, context: { params: Promise<{ filename: string }> }) {
  try {
    const params = await context.params;
    const filename = String(params?.filename || "");

    if (!filename) {
      return new NextResponse("Missing filename", { status: 400 });
    }

    // Get the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(CLIENT_CUSTOMIZATION_STORAGE)
      .download(filename);

    if (error || !data) {
      console.error("Error downloading file:", error);
      return new NextResponse("File not found", { status: 404 });
    }

    // Determine content type based on extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "svg") contentType = "image/svg+xml";

    // Return the file with appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

