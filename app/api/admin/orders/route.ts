import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!
);

const ORDERS_DB = process.env.NEXT_PUBLIC_SUPABASE_ORDERS_DB || "orders";

type Address = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
  phone?: string;
};

type OrderItem = {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    currency: "EUR";
  };
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "completed"
    | "cancelled"
    | "refunded";
  createdAt: string;
  date: string;
  shippingAddress: Address;
  billingAddress: Address;
  payment: {
    method: string;
    status: "pending" | "paid" | "refunded" | "failed";
    transactionId?: string;
  };
  shipping: {
    method: string;
    status: "pending" | "in_transit" | "delivered";
    trackingNumber?: string;
  };
  notes?: string;
};

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Mario Rossi",
    email: "mario.rossi@email.com",
    items: [
      {
        id: "it_1",
        name: "Sticker Pack Vintage",
        sku: "SPV-001",
        quantity: 2,
        unitPrice: 799,
      },
    ],
    totals: {
      subtotal: 1598,
      shipping: 300,
      tax: 100,
      total: 1998,
      currency: "EUR",
    },
    status: "completed",
    createdAt: "2024-01-15T10:25:00.000Z",
    date: "2024-01-15",
    shippingAddress: {
      fullName: "Mario Rossi",
      line1: "Via Roma 1",
      city: "Roma",
      postalCode: "00100",
      country: "IT",
      phone: "+39 345 0000001",
    },
    billingAddress: {
      fullName: "Mario Rossi",
      line1: "Via Roma 1",
      city: "Roma",
      postalCode: "00100",
      country: "IT",
    },
    payment: { method: "Carta", status: "paid", transactionId: "txn_001" },
    shipping: {
      method: "Corriere Espresso",
      status: "delivered",
      trackingNumber: "TRK001",
    },
    notes: "Lasciare al portiere.",
  },
];

function searchOrders(orders: Order[], query: string): Order[] {
  if (!query) return orders;
  const q = query.toLowerCase();
  return orders.filter((o) => {
    const hay = [
      o.id,
      o.customerName,
      o.email,
      o.status,
      ...o.items.map((i) => i.name),
      o.shippingAddress.city,
      o.billingAddress.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderUuid = searchParams.get("order_uuid");
  const supabaseId = searchParams.get("supabaseId");

  // If a specific order is requested, fetch from Supabase
  if (orderUuid || supabaseId) {
    try {
      let order = null;

      if (supabaseId) {
        const { data, error } = await supabaseAdmin
          .from(ORDERS_DB)
          .select("*")
          .eq("id", supabaseId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching order by ID:", error);
        } else {
          order = data;
        }
      } else if (orderUuid) {
        const { data, error } = await supabaseAdmin
          .from(ORDERS_DB)
          .select("*")
          .eq("order_uuid", orderUuid)
          .maybeSingle();

        if (error) {
          console.error("Error fetching order by UUID:", error);
        } else {
          order = data;
        }
      }

      if (!order) return NextResponse.json({ order: null });

      return NextResponse.json({
        order: {
          id: String(order.order_uuid || order.id),
          status: String(order.status || ""),
          spedition_info:
            typeof order.spedition_info === "string"
              ? order.spedition_info
              : "",
        },
      });
    } catch (e) {
      console.error("Error fetching order:", e);
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: 500 }
      );
    }
  }

  // Default: demo list
  const q = searchParams.get("q") || "";
  const filtered = searchOrders(mockOrders, q);
  return NextResponse.json({ orders: filtered });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderUuid: string = String(body?.order_uuid || "").trim();
    const supabaseId: string = String(body?.supabaseId || "").trim();
    const status: string | undefined =
      typeof body?.status === "string" ? String(body.status).trim() : undefined;
    const speditionInfoRaw = body?.spedition_info;
    const speditionInfo: string | undefined =
      typeof speditionInfoRaw === "string"
        ? String(speditionInfoRaw).trim()
        : undefined;

    if (!orderUuid && !supabaseId) {
      return NextResponse.json(
        { error: "order_uuid or supabaseId is required" },
        { status: 400 }
      );
    }

    if (status && status.toLowerCase() === "spedito" && !speditionInfo) {
      return NextResponse.json(
        { error: "spedition_info required when setting status to 'spedito'" },
        { status: 400 }
      );
    }

    const updates: Partial<{
      spedition_info: string;
      status: string;
    }> = {};

    if (typeof speditionInfo === "string") {
      updates.spedition_info = speditionInfo;
    }
    if (typeof status === "string") {
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Resolve order ID
    let orderId = supabaseId;

    if (!orderId && orderUuid) {
      const { data, error } = await supabaseAdmin
        .from(ORDERS_DB)
        .select("id")
        .eq("order_uuid", orderUuid)
        .maybeSingle();

      if (error || !data) {
        console.error("Error finding order:", error);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      orderId = data.id.toString();
    }

    // Update order
    const { data: updated, error: updateError } = await supabaseAdmin
      .from(ORDERS_DB)
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: orderId, order: updated });
  } catch (e) {
    const message =
      typeof (e as { message?: unknown })?.message === "string"
        ? (e as { message: string }).message
        : "Unexpected error";
    console.error("PATCH error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
