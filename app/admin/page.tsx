"use client";

import { useAccount } from "../components/AccountContext";
import { useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";

// MOCK: Sostituisci con fetch da Appwrite DB
const mockOrders = [
  {
    id: "ORD-001",
    status: "In lavorazione",
    createdAt: "2024-06-01",
    total: "19.90€",
  },
  {
    id: "ORD-002",
    status: "Spedito",
    createdAt: "2024-05-20",
    total: "12.50€",
  },
];

export default function UserDashboard() {
  const { user, loading } = useAccount();
  const [orders, setOrders] = useState<typeof mockOrders>([]);

  useEffect(() => {
    // Qui fetch da Appwrite DB in futuro
    setOrders(mockOrders);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-purple-600 mb-2" />
        <span className="text-gray-600">Caricamento...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-gray-600">Devi essere autenticato per vedere i tuoi ordini.</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="text-purple-600" /> I miei ordini
      </h1>
      {orders.length === 0 ? (
        <div className="text-gray-500">Nessun ordine trovato.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow border p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-gray-800">{order.id}</div>
                <div className="text-gray-500 text-sm">{order.createdAt}</div>
              </div>
              <div className="flex items-center gap-4 mt-2 md:mt-0">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {order.status}
                </span>
                <span className="font-bold text-gray-700">{order.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
