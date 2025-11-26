import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const PRODUCTS_DB = process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_DB || "products";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dec: Record<string, number> = body?.dec || {};
    const uuids = Object.keys(dec).filter((u) => u);

    if (uuids.length === 0) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    let updated = 0;

    for (const u of uuids) {
      try {
        // Fetch product by uuid
        const { data: product, error: fetchError } = await supabaseAdmin
          .from(PRODUCTS_DB)
          .select("id, stock")
          .eq("uuid", u)
          .maybeSingle();

        if (fetchError || !product) continue;

        const current = Number(product.stock || 0);
        const delta = Number(dec[u] || 0);

        if (
          !Number.isFinite(current) ||
          !Number.isFinite(delta) ||
          delta <= 0
        ) {
          continue;
        }

        const next = Math.max(0, current - delta);

        if (next === current) continue;

        // Update stock
        const { error: updateError } = await supabaseAdmin
          .from(PRODUCTS_DB)
          .update({ stock: next })
          .eq("id", product.id);

        if (!updateError) {
          updated += 1;
        }
      } catch (e) {
        console.error("Error updating stock for", u, e);
      }
    }

    return NextResponse.json({ ok: true, updated, processed: uuids.length });
  } catch (e) {
    const message =
      typeof (e as { message?: unknown })?.message === "string"
        ? (e as { message: string }).message
        : "Unexpected error";
    console.error("commit-stock error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
