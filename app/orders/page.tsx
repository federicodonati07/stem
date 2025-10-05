"use client";

import React from "react";
import { databases, Query } from "../components/auth/appwriteClient";
import { useAccount } from "../components/AccountContext";
import { Button } from "@heroui/react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    pagato: { bg: 'bg-green-50', text: 'text-green-700' },
    elaborazione: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    spedito: { bg: 'bg-blue-50', text: 'text-blue-700' },
  };
  const c = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{status}</span>;
}

export default function OrdersPage() {
  const { user } = useAccount();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [productsMap, setProductsMap] = React.useState<Record<string, any>>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
  const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB as string | undefined;
  const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB as string | undefined;

  React.useEffect(() => {
    (async () => {
      if (!user || !dbId || !ordersCol) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const res = await databases.listDocuments(dbId, ordersCol, [Query.equal('user_uuid', user.$id), Query.orderDesc('$createdAt'), Query.limit(50)]);
        const docs = (res.documents as any[]) || [];
        const filtered = docs.filter((d) => String(d?.status || '').toLowerCase() !== 'archiviato');
        setOrders(filtered);
      } catch {
        setError('Impossibile caricare gli ordini');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, dbId, ordersCol]);

  // Carica dettagli prodotti per mostrare i nomi
  React.useEffect(() => {
    (async () => {
      if (!dbId || !productsCol || orders.length === 0) { setProductsMap({}); return; }
      const uuids = new Set<string>();
      for (const o of orders) {
        const items = Array.isArray(o.selected_products) ? o.selected_products : [];
        for (const s of items) {
          try {
            const it = typeof s === 'string' ? JSON.parse(s) : s;
            if (it && typeof it.uuid === 'string') uuids.add(String(it.uuid));
          } catch {}
        }
      }
      if (uuids.size === 0) { setProductsMap({}); return; }
      try {
        const res = await databases.listDocuments(dbId, productsCol, [Query.equal('uuid', Array.from(uuids)), Query.limit(200)]);
        const map: Record<string, any> = {};
        for (const d of res.documents as any[]) map[String(d.uuid)] = d;
        setProductsMap(map);
      } catch {
        setProductsMap({});
      }
    })();
  }, [orders, dbId, productsCol]);

  const steps = ['pagato', 'elaborazione', 'spedito'];
  function statusIndex(status?: string) {
    const s = String(status || '').toLowerCase();
    const i = steps.indexOf(s);
    return i >= 0 ? i : 0;
  }
  function parsePriceToNumber(val: any): number {
    const n = parseFloat(String(val ?? '').replace(/[^0-9.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function formatEur(n: number): string {
    return `€${n.toFixed(2)} /EUR`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">I miei ordini</h1>
          <Link href="/#shop">
            <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">Torna allo shop</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-600">Caricamento…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-gray-700">Nessun ordine trovato.</p>
            <Link href="/#shop">
              <Button className="mt-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">Vai allo shop</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const items = Array.isArray(o.selected_products) ? o.selected_products : [];
              const parsed = items.map((s: any) => { try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return null; } }).filter(Boolean);
              const idx = statusIndex(o.status);
              const percent = (idx / (steps.length - 1)) * 100;
              const isOpen = !!open[o.$id];
              // Calcolo totale ordine: usa unit_price salvato, altrimenti fallback al prezzo corrente dal productsMap
              let orderTotal = 0;
              for (const it of parsed) {
                const qty = Number(it?.quantity) || 0;
                let unit = 0;
                if (it && it.unit_price !== undefined) {
                  unit = parseFloat(String(it.unit_price));
                  if (!Number.isFinite(unit)) unit = 0;
                } else if (it && it.uuid && productsMap[it.uuid]) {
                  unit = parsePriceToNumber(productsMap[it.uuid]?.price);
                }
                orderTotal += unit * qty;
              }
              return (
                <div key={o.$id} className={`bg-white rounded-2xl border ${isOpen ? 'border-purple-300' : 'border-gray-200'} shadow-sm transition-colors`}>
                  <button className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setOpen((m) => ({ ...m, [o.$id]: !m[o.$id] }))}>
                    <div>
                      <div className="text-sm text-gray-600">Ordine <span className="font-semibold text-gray-900">{o.order_uuid || o.$id}</span></div>
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          {steps.map((s, i) => (
                            <span key={`dot-${s}`} className={`w-2.5 h-2.5 rounded-full ${i <= idx ? 'bg-purple-600' : 'bg-gray-300'}`} />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                          {steps.map((s, i) => (
                            <span key={s} className={`${i <= idx ? 'text-purple-700 font-semibold' : ''}`}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatEur(orderTotal)}</div>
                      <StatusBadge status={String(o.status || 'pagato')} />
                      <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="divide-y divide-gray-100">
                        {parsed.map((it: any, idx2: number) => (
                          <div key={idx2} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={`/api/media/products/${it.uuid}`} alt={it.uuid} className="w-12 h-12 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                              <div className="text-sm text-gray-700">
                                <div className="font-medium text-gray-900">{productsMap[it.uuid]?.name || `Prodotto ${it.uuid}`}</div>
                                <div className="flex items-center gap-2">
                                  {it.personalized ? (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">{String(it.personalized).startsWith('/api/media/products/') ? 'Immagine' : `Testo: "${String(it.personalized).slice(0, 16)}${String(it.personalized).length > 16 ? '…' : ''}"`}</span>
                                  ) : null}
                                  {it.color ? <span className="inline-flex items-center gap-1 text-xs text-gray-700">Colore <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: it.color }} /></span> : null}
                                  {it.unit_price ? <span className="text-xs text-gray-700">Prezzo: €{Number(it.unit_price).toFixed(2)} /EUR</span> : null}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">x{it.quantity || 1}</div>
                              {it.unit_price ? (
                                <div className="text-xs text-gray-600">Tot: €{((Number(it.unit_price) || 0) * (Number(it.quantity) || 0)).toFixed(2)} /EUR</div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
