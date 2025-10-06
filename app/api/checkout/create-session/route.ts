import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const secret =
      process.env.NEXT_PUBLIC_STRIPE_PRIVATE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_SECRET ||
      process.env.STRIPE_SECRET ||
      process.env.NEXT_PUBLIC_STRIPE_PRIVATE_KEY;
    if (!secret)
      return NextResponse.json(
        { error: "Missing Stripe secret" },
        { status: 500 }
      );

    const body = await req.json();
    const { items, success_url, cancel_url } = body || {};
    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: "No items" }, { status: 400 });

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set(
      "success_url",
      success_url ||
        `${req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    );
    form.set("cancel_url", cancel_url || `${req.nextUrl.origin}/cart`);

    items.forEach((it: { name?: string; amount?: number; quantity?: number }, idx: number) => {
      const i = String(idx);
      form.set(`line_items[${i}][price_data][currency]`, "eur");
      form.set(
        `line_items[${i}][price_data][product_data][name]`,
        String(it.name || "Prodotto")
      );
      form.set(
        `line_items[${i}][price_data][unit_amount]`,
        String(Math.max(0, Math.round(Number(it.amount) || 0)))
      );
      form.set(
        `line_items[${i}][quantity]`,
        String(Math.max(1, Number(it.quantity) || 1))
      );
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: "Stripe error", details: txt },
        { status: 500 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ url: data.url, id: data.id });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
