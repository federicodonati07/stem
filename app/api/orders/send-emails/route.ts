import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

type EmailItem = {
  uuid: string;
  name?: string;
  quantity: number;
  unit_price?: number | string;
  color?: string;
  personalized?: string;
};

function formatEUR(n: number) {
  try {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(n);
  } catch {
    return `€${n.toFixed(2)} /EUR`;
  }
}

function buildOrderHtml({
  orderId,
  items,
  total,
}: {
  orderId: string;
  items: EmailItem[];
  total: number;
}) {
  const rows = items
    .map((it) => {
      const unit =
        typeof it.unit_price === "number"
          ? it.unit_price
          : parseFloat(
              String(it.unit_price || "0")
                .replace(/[^0-9.,]/g, "")
                .replace(",", ".")
            ) || 0;
      const line = unit * (Number(it.quantity) || 0);
      const personal = it.personalized
        ? it.personalized.startsWith("/api/media/products/")
          ? "Immagine"
          : `Testo: ${String(it.personalized)}`
        : "";
      return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#0f172a">${
          it.name || it.uuid
        }</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#334155">x${
          it.quantity
        }</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#334155">${
          it.color
            ? `<span style=\"display:inline-block;width:10px;height:10px;border:1px solid #cbd5e1;border-radius:50%;background:${it.color}\"></span>`
            : ""
        }</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6b7280">${personal}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#0f172a;font-weight:600">${formatEUR(
          line
        )}</td>
      </tr>`;
    })
    .join("");
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;padding:24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background:linear-gradient(90deg,#7c3aed,#2563eb);color:#fff">
          <div style="font-size:18px;font-weight:800;letter-spacing:.2px">Stem</div>
          <div style="font-size:12px;opacity:.9">Conferma ordine</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px">
          <div style="font-size:16px;color:#0f172a;font-weight:700;margin-bottom:4px">Grazie per il tuo acquisto!</div>
          <div style="font-size:14px;color:#334155;margin-bottom:16px">ID Ordine: <span style="font-weight:600;color:#0f172a">${orderId}</span></div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase">Articolo</th>
                <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase">Qtà</th>
                <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase">Colore</th>
                <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase">Personalizzazione</th>
                <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase">Totale</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:16px;text-align:right;font-size:14px;color:#0f172a"><span style="font-weight:700">Totale ordine:</span> ${formatEUR(
            total
          )}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">Questo messaggio è stato inviato da Stem · noreply</td>
      </tr>
    </table>
  </div>`;
}

export async function POST(req: NextRequest) {
  try {
    const resendKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;

    if (!resendKey) {
      return NextResponse.json(
        { error: "Missing Resend API key" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const orderId: string = String(body?.order_uuid || body?.orderId || "");
    const userUuid: string = String(body?.user_uuid || body?.userUuid || "");
    const items: EmailItem[] = Array.isArray(body?.items) ? body.items : [];
    const totalNum = Number(body?.total || 0);

    if (!orderId || !userUuid) {
      return NextResponse.json(
        { error: "Missing order/user" },
        { status: 400 }
      );
    }

    // Fetch customer email via Supabase Auth
    let customerEmail = "";
    try {
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.admin.getUserById(userUuid);

      if (error) {
        console.error("Error fetching user:", error);
      } else if (user) {
        customerEmail = user.email || "";
      }
    } catch (e) {
      console.error("Error fetching customer email:", e);
    }

    // Fetch admin email (users with admin role in metadata)
    let adminEmail = "";
    try {
      // In Supabase, we can fetch users with admin role from metadata
      // For simplicity, you might want to hardcode an admin email or use a different approach
      // Here's an example of hardcoding or using an env variable
      adminEmail = process.env.ADMIN_EMAIL || "";

      // Alternative: query users with admin role from app_metadata
      // This would require a custom query or RLS policy
    } catch (e) {
      console.error("Error fetching admin email:", e);
    }

    const fromEmail = "noreply@stemcast.netlify.app.com";
    const userHtml = buildOrderHtml({ orderId, items, total: totalNum });

    // Send to customer
    if (customerEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: customerEmail,
          subject: `Conferma ordine ${orderId}`,
          html: userHtml,
        }),
      });
    }

    // Send to admin
    if (adminEmail) {
      const adminHtml = `
        <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#fff;padding:16px">
          <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px">Nuovo ordine creato</div>
          <div style="font-size:14px;color:#334155;margin-bottom:12px">ID Ordine: <strong>${orderId}</strong> — Totale: <strong>${formatEUR(
        totalNum
      )}</strong></div>
          <div style="font-size:13px;color:#475569">Cliente: ${
            customerEmail || "n/d"
          }</div>
        </div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: adminEmail,
          subject: `Nuovo ordine ${orderId}`,
          html: adminHtml,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("send-emails error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
