import { NextResponse } from "next/server";

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
  unitPrice: number; // in minor units (cents)
};

type Order = {
  id: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  totals: {
    subtotal: number; // cents
    shipping: number; // cents
    tax: number; // cents
    total: number; // cents
    currency: "EUR";
  };
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "completed"
    | "cancelled"
    | "refunded";
  createdAt: string; // ISO
  date: string; // YYYY-MM-DD for table convenience
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
  {
    id: "ORD-002",
    customerName: "Giulia Bianchi",
    email: "giulia.bianchi@email.com",
    items: [
      {
        id: "it_2",
        name: "Sticker Personalizzato",
        sku: "CUST-001",
        quantity: 1,
        unitPrice: 1299,
      },
    ],
    totals: {
      subtotal: 1299,
      shipping: 300,
      tax: 100,
      total: 1699,
      currency: "EUR",
    },
    status: "processing",
    createdAt: "2024-01-14T15:10:00.000Z",
    date: "2024-01-14",
    shippingAddress: {
      fullName: "Giulia Bianchi",
      line1: "Via Milano 22",
      city: "Milano",
      postalCode: "20100",
      country: "IT",
      phone: "+39 345 0000002",
    },
    billingAddress: {
      fullName: "Giulia Bianchi",
      line1: "Via Milano 22",
      city: "Milano",
      postalCode: "20100",
      country: "IT",
    },
    payment: { method: "PayPal", status: "paid", transactionId: "txn_002" },
    shipping: { method: "Corriere Standard", status: "pending" },
  },
  {
    id: "ORD-003",
    customerName: "Luca Verdi",
    email: "luca.verdi@email.com",
    items: [
      {
        id: "it_3",
        name: "Sticker Pack Neon",
        sku: "SPN-003",
        quantity: 3,
        unitPrice: 999,
      },
      {
        id: "it_4",
        name: "Sticker Olografico",
        sku: "HOLO-001",
        quantity: 1,
        unitPrice: 499,
      },
    ],
    totals: {
      subtotal: 3496,
      shipping: 300,
      tax: 200,
      total: 3996,
      currency: "EUR",
    },
    status: "shipped",
    createdAt: "2024-01-13T09:45:00.000Z",
    date: "2024-01-13",
    shippingAddress: {
      fullName: "Luca Verdi",
      line1: "Via Napoli 5",
      city: "Napoli",
      postalCode: "80100",
      country: "IT",
      phone: "+39 345 0000003",
    },
    billingAddress: {
      fullName: "Luca Verdi",
      line1: "Via Napoli 5",
      city: "Napoli",
      postalCode: "80100",
      country: "IT",
    },
    payment: { method: "Carta", status: "paid", transactionId: "txn_003" },
    shipping: {
      method: "Corriere Espresso",
      status: "in_transit",
      trackingNumber: "TRK003",
    },
  },
  {
    id: "ORD-004",
    customerName: "Anna Neri",
    email: "anna.neri@email.com",
    items: [
      {
        id: "it_5",
        name: "Sticker Kawaii",
        sku: "KAWA-001",
        quantity: 1,
        unitPrice: 1499,
      },
    ],
    totals: {
      subtotal: 1499,
      shipping: 300,
      tax: 100,
      total: 1899,
      currency: "EUR",
    },
    status: "pending",
    createdAt: "2024-01-12T11:20:00.000Z",
    date: "2024-01-12",
    shippingAddress: {
      fullName: "Anna Neri",
      line1: "Via Torino 8",
      city: "Torino",
      postalCode: "10100",
      country: "IT",
    },
    billingAddress: {
      fullName: "Anna Neri",
      line1: "Via Torino 8",
      city: "Torino",
      postalCode: "10100",
      country: "IT",
    },
    payment: { method: "Carta", status: "pending" },
    shipping: { method: "Corriere Standard", status: "pending" },
  },
  {
    id: "ORD-005",
    customerName: "Paolo Conte",
    email: "paolo.conte@email.com",
    items: [
      {
        id: "it_6",
        name: "Sticker Minimal",
        sku: "MIN-010",
        quantity: 2,
        unitPrice: 699,
      },
      {
        id: "it_7",
        name: "Sticker Retro",
        sku: "RET-004",
        quantity: 1,
        unitPrice: 899,
      },
    ],
    totals: {
      subtotal: 2297,
      shipping: 0,
      tax: 0,
      total: 2297,
      currency: "EUR",
    },
    status: "processing",
    createdAt: "2024-01-16T08:15:00.000Z",
    date: "2024-01-16",
    shippingAddress: {
      fullName: "Paolo Conte",
      line1: "Via Firenze 12",
      city: "Firenze",
      postalCode: "50100",
      country: "IT",
    },
    billingAddress: {
      fullName: "Paolo Conte",
      line1: "Via Firenze 12",
      city: "Firenze",
      postalCode: "50100",
      country: "IT",
    },
    payment: { method: "Contrassegno", status: "pending" },
    shipping: { method: "Ritiro in negozio", status: "pending" },
  },
  {
    id: "ORD-006",
    customerName: "Sara Blu",
    email: "sara.blu@email.com",
    items: [
      {
        id: "it_8",
        name: "Sticker Glitter",
        sku: "GLIT-002",
        quantity: 4,
        unitPrice: 599,
      },
    ],
    totals: {
      subtotal: 2396,
      shipping: 300,
      tax: 150,
      total: 2846,
      currency: "EUR",
    },
    status: "completed",
    createdAt: "2024-01-11T17:05:00.000Z",
    date: "2024-01-11",
    shippingAddress: {
      fullName: "Sara Blu",
      line1: "Via Genova 3",
      city: "Genova",
      postalCode: "16100",
      country: "IT",
    },
    billingAddress: {
      fullName: "Sara Blu",
      line1: "Via Genova 3",
      city: "Genova",
      postalCode: "16100",
      country: "IT",
    },
    payment: { method: "Carta", status: "paid", transactionId: "txn_006" },
    shipping: {
      method: "Corriere Espresso",
      status: "delivered",
      trackingNumber: "TRK006",
    },
  },
  {
    id: "ORD-007",
    customerName: "Marco Polo",
    email: "marco.polo@email.com",
    items: [
      {
        id: "it_9",
        name: "Sticker Travel",
        sku: "TRV-007",
        quantity: 1,
        unitPrice: 1099,
      },
    ],
    totals: {
      subtotal: 1099,
      shipping: 300,
      tax: 100,
      total: 1499,
      currency: "EUR",
    },
    status: "cancelled",
    createdAt: "2024-01-10T12:00:00.000Z",
    date: "2024-01-10",
    shippingAddress: {
      fullName: "Marco Polo",
      line1: "Via Venezia 4",
      city: "Venezia",
      postalCode: "30100",
      country: "IT",
    },
    billingAddress: {
      fullName: "Marco Polo",
      line1: "Via Venezia 4",
      city: "Venezia",
      postalCode: "30100",
      country: "IT",
    },
    payment: { method: "Carta", status: "failed" },
    shipping: { method: "Corriere Standard", status: "pending" },
  },
  {
    id: "ORD-008",
    customerName: "Elisa Viola",
    email: "elisa.viola@email.com",
    items: [
      {
        id: "it_10",
        name: "Sticker Galaxy",
        sku: "GAL-011",
        quantity: 2,
        unitPrice: 1299,
      },
    ],
    totals: {
      subtotal: 2598,
      shipping: 0,
      tax: 0,
      total: 2598,
      currency: "EUR",
    },
    status: "refunded",
    createdAt: "2024-01-09T19:30:00.000Z",
    date: "2024-01-09",
    shippingAddress: {
      fullName: "Elisa Viola",
      line1: "Via Palermo 9",
      city: "Palermo",
      postalCode: "90100",
      country: "IT",
    },
    billingAddress: {
      fullName: "Elisa Viola",
      line1: "Via Palermo 9",
      city: "Palermo",
      postalCode: "90100",
      country: "IT",
    },
    payment: { method: "PayPal", status: "refunded", transactionId: "txn_008" },
    shipping: { method: "Corriere Standard", status: "pending" },
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
  const appwriteId = searchParams.get("appwriteId");

  // If a specific order is requested (to read current spedition_info), fetch from Appwrite
  if (orderUuid || appwriteId) {
    try {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const apiKey =
        process.env.NEXT_APPWRITE_API_KEY ||
        process.env.APPWRITE_API_KEY ||
        process.env.NEXT_PUBLIC_APPWRITE_API_KEY;
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB;
      const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB;
      if (!endpoint || !projectId || !apiKey || !dbId || !ordersCol) {
        return NextResponse.json(
          { error: "Missing Appwrite configuration" },
          { status: 500 }
        );
      }
      const base = endpoint.replace(/\/$/, "");
      let doc: Record<string, unknown> | null = null;
      if (appwriteId) {
        const res = await fetch(
          `${base}/databases/${dbId}/collections/${ordersCol}/documents/${encodeURIComponent(
            appwriteId
          )}`,
          {
            method: "GET",
            headers: {
              "X-Appwrite-Project": projectId,
              "X-Appwrite-Key": apiKey,
            },
            cache: "no-store",
          }
        );
        if (res.ok) doc = await res.json();
      } else if (orderUuid) {
        const listUrl = new URL(
          `${base}/databases/${dbId}/collections/${ordersCol}/documents`
        );
        listUrl.searchParams.append(
          "queries[]",
          `equal("order_uuid", "${orderUuid}")`
        );
        listUrl.searchParams.set("limit", "1");
        const res = await fetch(listUrl.toString(), {
          method: "GET",
          headers: {
            "X-Appwrite-Project": projectId,
            "X-Appwrite-Key": apiKey,
          },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          doc = Array.isArray(data?.documents) ? data.documents[0] : null;
        }
      }
      if (!doc) return NextResponse.json({ order: null });
      return NextResponse.json({
        order: {
          id: String(doc.order_uuid || doc.$id),
          status: String(doc.status || ""),
          spedition_info:
            typeof doc.spedition_info === "string" ? doc.spedition_info : "",
        },
      });
    } catch (e) {
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
    const appwriteId: string = String(body?.appwriteId || "").trim();
    const status: string | undefined =
      typeof body?.status === "string" ? String(body.status).trim() : undefined;
    const speditionInfoRaw = body?.spedition_info;
    const speditionInfo: string | undefined =
      typeof speditionInfoRaw === "string"
        ? String(speditionInfoRaw).trim()
        : undefined;

    if (!orderUuid && !appwriteId) {
      return NextResponse.json(
        { error: "order_uuid or appwriteId is required" },
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

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey =
      process.env.NEXT_APPWRITE_API_KEY ||
      process.env.APPWRITE_API_KEY ||
      process.env.NEXT_PUBLIC_APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB;
    const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB;
    if (!endpoint || !projectId || !apiKey || !dbId || !ordersCol) {
      return NextResponse.json(
        { error: "Missing Appwrite configuration" },
        { status: 500 }
      );
    }
    const base = endpoint.replace(/\/$/, "");

    // Resolve document id
    let docId = appwriteId;
    if (!docId) {
      const listUrl = new URL(
        `${base}/databases/${dbId}/collections/${ordersCol}/documents`
      );
      listUrl.searchParams.append(
        "queries[]",
        `equal("order_uuid", "${orderUuid}")`
      );
      listUrl.searchParams.set("limit", "1");
      const listRes = await fetch(listUrl.toString(), {
        method: "GET",
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
        },
        cache: "no-store",
      });
      if (!listRes.ok) {
        const txt = await listRes.text().catch(() => "");
        return NextResponse.json(
          { error: "Order not found", details: txt },
          { status: 404 }
        );
      }
      const data = await listRes.json();
      const doc = Array.isArray(data?.documents) ? data.documents[0] : null;
      if (!doc?.$id) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      docId = String(doc.$id);
    }

    // Patch document
    const patchRes = await fetch(
      `${base}/databases/${dbId}/collections/${ordersCol}/documents/${encodeURIComponent(
        docId
      )}`,
      {
        method: "PATCH",
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: updates }),
      }
    );
    if (!patchRes.ok) {
      const txt = await patchRes.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to update order", details: txt },
        { status: 500 }
      );
    }
    const updated = await patchRes.json();
    return NextResponse.json({ ok: true, id: docId, order: updated });
  } catch (e) {
    const message =
      typeof (e as { message?: unknown })?.message === "string"
        ? (e as { message: string }).message
        : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
