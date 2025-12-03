"use client";

import React from "react";
/* eslint-disable @next/next/no-img-element */
import { supabase, ORDERS_DB, PRODUCTS_DB } from "../components/auth/supabaseClient";
import { useAccount } from "../components/AccountContext";
import { Button } from "@heroui/react";
import Link from "next/link";
import { ChevronDown, Package, Truck, CheckCircle, Clock, ShoppingBag, Copy, Check, type LucideIcon } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: LucideIcon; label: string }> = {
    pagato: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: ' Pagato' },
    elaborazione: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: ' In elaborazione' },
    spedito: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck, label: ' Spedito' },
  };
  const c = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Package, label: status };
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${c.bg} ${c.text}`}>
      <Icon size={16} />
      {c.label}
    </span>
  );
}

export default function OrdersPage() {
  const { user } = useAccount();
  type OrderDoc = { id: string; status?: string; order_uuid?: string; selected_products?: unknown[]; spedition_info?: string };
  type ProductDoc = { uuid?: string; name?: string; price?: string | number };
  const [orders, setOrders] = React.useState<OrderDoc[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [productsMap, setProductsMap] = React.useState<Record<string, ProductDoc>>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [copied, setCopied] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from(ORDERS_DB)
          .select('*')
          .eq('user_uuid', user.$id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (fetchError) {
          console.error('Error fetching orders:', fetchError);
          setError('Impossibile caricare gli ordini');
          setLoading(false);
          return;
        }
        
        const docs = (data || []).map(d => ({
          id: d.id?.toString() || '',
          status: d.status,
          order_uuid: d.order_uuid,
          selected_products: d.selected_products,
          spedition_info: d.spedition_info,
        }));
        const filtered = docs.filter((d) => String(d?.status || '').toLowerCase() !== 'archiviato');
        setOrders(filtered);
      } catch {
        setError('Impossibile caricare gli ordini');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Carica dettagli prodotti per mostrare i nomi
  React.useEffect(() => {
    (async () => {
      if (orders.length === 0) { setProductsMap({}); return; }
      const uuids = new Set<string>();
      for (const o of orders) {
        const items = Array.isArray(o.selected_products) ? o.selected_products : [];
        for (const s of items) {
          try {
            const it = s as { uuid?: string };
            if (it && typeof it.uuid === 'string') uuids.add(String(it.uuid));
          } catch {}
        }
      }
      if (uuids.size === 0) { setProductsMap({}); return; }
      try {
        const { data, error } = await supabase
          .from(PRODUCTS_DB)
          .select('*')
          .in('uuid', Array.from(uuids))
          .limit(200);
        
        if (error) {
          console.error('Error fetching products:', error);
          setProductsMap({});
          return;
        }
        
        const map: Record<string, ProductDoc> = {};
        for (const d of (data || [])) {
          map[String(d.uuid)] = { 
            uuid: String(d.uuid), 
            name: typeof d.name === 'string' ? d.name : undefined, 
            price: (typeof d.price === 'string' || typeof d.price === 'number') ? d.price : undefined 
          };
        }
        setProductsMap(map);
      } catch {
        setProductsMap({});
      }
    })();
  }, [orders]);

  const steps = ['pagato', 'elaborazione', 'spedito'];
  function statusIndex(status?: string) {
    const s = String(status || '').toLowerCase();
    const i = steps.indexOf(s);
    return i >= 0 ? i : 0;
  }
  function parsePriceToNumber(val: unknown): number {
    const n = parseFloat(String(val ?? '').replace(/[^0-9.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function formatEur(n: number): string {
    return `€${n.toFixed(2)} /EUR`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <Package size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">I miei ordini</h1>
                <p className="text-sm text-gray-600">{orders.length} {orders.length === 1 ? 'ordine' : 'ordini'} trovato</p>
              </div>
            </div>
            <Link href="/#shop">
              <Button 
                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl"
                startContent={<ShoppingBag size={18} />}
              >
                Torna allo shop
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center shadow-lg">
            <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Caricamento ordini…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-bold text-lg">⚠️ {error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nessun ordine</h3>
            <p className="text-gray-600 mb-6">Non hai ancora effettuato ordini</p>
            <Link href="/#shop">
              <Button 
                size="lg"
                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg"
                startContent={<ShoppingBag size={20} />}
              >
                Vai allo shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((o) => {
              const items = Array.isArray(o.selected_products) ? o.selected_products : [];
              const parsed = items.map((s: unknown) => { try { return s; } catch { return null; } }).filter(Boolean) as Array<{ uuid?: string; quantity?: number; unit_price?: string | number; personalized?: string; color?: string }>;
              const idx = statusIndex(o.status);
              const percent = (idx / (steps.length - 1)) * 100;
              const isOpen = !!open[o.id];
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
                <div key={o.id} className={`bg-white rounded-2xl border-2 shadow-lg transition-all duration-300 ${isOpen ? 'border-purple-400 shadow-purple-200' : 'border-gray-200 hover:border-purple-200 hover:shadow-xl'}`}>
                  <button className="w-full p-6 cursor-pointer transition-all" onClick={() => setOpen((m) => ({ ...m, [o.id]: !m[o.id] }))}>
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                            <Package size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ordine</p>
                            <p className="font-bold text-gray-900 text-base">#{o.order_uuid || o.id}</p>
                          </div>
                        </div>

                        {/* Tracking Info */}
                        {String(o.status || '').toLowerCase()==='spedito' && o.spedition_info ? (
                          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Truck size={18} className="text-blue-600" />
                                <span className="text-sm font-bold text-blue-900">Tracking DHL</span>
                              </div>
                              <button
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-all ${copied[o.id] ? 'bg-green-500 text-white' : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-300'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  const raw = String(o.spedition_info);
                                  const val = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : raw;
                                  navigator.clipboard?.writeText(val).then(() => {
                                    setCopied((m) => ({ ...m, [o.id]: true }));
                                    setTimeout(() => {
                                      setCopied((m) => ({ ...m, [o.id]: false }));
                                    }, 1500);
                                  }).catch(() => {});
                                }}
                              >
                                {copied[o.id] ? (
                                  <>
                                    <Check size={16} />
                                    Copiato!
                                  </>
                                ) : (
                                  <>
                                    {(() => {
                                      const raw = String(o.spedition_info);
                                      return raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : raw;
                                    })()}
                                    <Copy size={14} />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (String(o.status || '').toLowerCase()!=='spedito' ? (
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                              <Clock size={14} />
                              Il tracking DHL sarà disponibile una volta spedito l&apos;ordine
                            </p>
                          </div>
                        ) : null)}

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 transition-all duration-500 rounded-full" 
                              style={{ width: `${percent}%` }} 
                            />
                          </div>
                          
                          {/* Steps */}
                          <div className="flex items-center justify-between px-1">
                            {steps.map((s, i) => (
                              <div key={s} className="flex flex-col items-center gap-1">
                                <div className={`w-3 h-3 rounded-full transition-all ${i <= idx ? 'bg-purple-600 shadow-md scale-110' : 'bg-gray-300'}`} />
                                <span className={`text-xs font-medium ${i <= idx ? 'text-purple-700' : 'text-gray-500'}`}>
                                  {s}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price and Status */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-medium mb-1">Totale</p>
                          <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                            €{orderTotal.toFixed(2)}
                          </p>
                        </div>
                        <StatusBadge status={String(o.status || 'pagato')} />
                        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          <ChevronDown size={20} className="text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t-2 border-gray-100">
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <ShoppingBag size={16} />
                          Prodotti ({parsed.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {parsed.map((it, idx2: number) => {
                          const itemTotal = ((Number(it.unit_price) || 0) * (Number(it.quantity) || 0));
                          return (
                            <div key={idx2} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-4 hover:shadow-md transition-all">
                              <div className="flex items-start gap-4">
                                {/* Image */}
                                <img 
                                  src={`/api/media/products/${it.uuid}`} 
                                  alt={String(it.uuid)} 
                                  className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 shadow-sm" 
                                  onError={(e) => { 
                                    (e.currentTarget as HTMLImageElement).onerror = null; 
                                    (e.currentTarget as HTMLImageElement).src = '/window.svg'; 
                                  }} 
                                />
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-gray-900 text-base mb-2 line-clamp-2">
                                    {productsMap[it.uuid || '']?.name || `Prodotto ${it.uuid}`}
                                  </h5>
                                  
                                  {/* Tags */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {it.personalized && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-bold">
                                        ✨ {(String(it.personalized).startsWith('/api/media/products/') || String(it.personalized).startsWith('client_customization/')) ? 'Immagine personalizzata' : `"${String(it.personalized).slice(0, 20)}${String(it.personalized).length > 20 ? '…' : ''}"`}
                                      </span>
                                    )}
                                    {it.color && (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                                        <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: it.color }} />
                                        Colore
                                      </span>
                                    )}
                                  </div>

                                  {/* Price Info */}
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-600">Prezzo unitario: <span className="font-semibold text-gray-900">€{Number(it.unit_price || 0).toFixed(2)}</span></span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">Quantità: <span className="font-semibold text-gray-900">×{it.quantity || 1}</span></span>
                                  </div>
                                </div>

                                {/* Total Price */}
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 mb-1">Subtotale</p>
                                  <p className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                                    €{itemTotal.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Total Summary */}
                      <div className="mt-5 pt-5 border-t-2 border-gray-200">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-gray-900">Totale ordine</span>
                            <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                              {formatEur(orderTotal)}
                            </span>
                          </div>
                        </div>
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
