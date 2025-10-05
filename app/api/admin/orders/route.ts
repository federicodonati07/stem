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
  const q = searchParams.get("q") || "";
  const filtered = searchOrders(mockOrders, q);
  return NextResponse.json({ orders: filtered });
}
