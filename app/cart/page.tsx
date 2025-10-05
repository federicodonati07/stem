"use client";

import React from "react";
import { useCart } from "../components/CartContext";
import Link from "next/link";
import { Button } from "@heroui/react";
import { databases, Query } from "../components/auth/appwriteClient";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from "../components/AccountContext";

export default function CartPage() {
  const { cartItems, cartCount, updateQuantity, removeItem, clearCart, setPurchased } = useCart();
  const router = useRouter();
  const { user, userInfo, loading: accountLoading } = useAccount();

  // Build product details map (cart)
  const [products, setProducts] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const uuids = Array.from(new Set(cartItems.map(i => i.uuid)));
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
    const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB as string | undefined;
    if (!dbId || !productsCol || uuids.length === 0) { setProducts({}); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await databases.listDocuments(dbId, productsCol, [Query.equal("uuid", uuids), Query.limit(100)]);
        const map: Record<string, any> = {};
        for (const d of res.documents as any[]) map[String(d.uuid)] = d;
        setProducts(map);
      } catch {
        setProducts({});
      } finally {
        setLoading(false);
      }
    })();
  }, [cartItems]);

  // Group identical items by uuid+color+personalized (cart)
  const grouped = React.useMemo(() => {
    const map = new Map<string, { key: string; sample: any; quantity: number; purchased: boolean }>();
    for (const i of cartItems) {
      const key = `${i.uuid}|${i.color || ''}|${i.personalized || ''}`;
      const cur = map.get(key);
      if (cur) {
        cur.quantity += i.quantity || 0;
        cur.purchased = cur.purchased && !!i.purchased;
      } else {
        map.set(key, { key, sample: i, quantity: i.quantity || 0, purchased: !!i.purchased });
      }
    }
    return Array.from(map.values());
  }, [cartItems]);

  const subtotal = React.useMemo(() => {
    let sum = 0;
    for (const g of grouped) {
      const p = products[g.sample.uuid];
      if (!p) continue;
      const priceNum = parseFloat(String(p.price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      if (g.purchased) sum += priceNum * g.quantity;
    }
    return sum;
  }, [grouped, products]);

  const shipping = 0; // placeholder
  const total = subtotal + shipping;

  // Count of selected (purchased) items for enabling checkout
  const selectedCount = React.useMemo(() => grouped.reduce((acc, g) => acc + (g.purchased ? g.quantity : 0), 0), [grouped]);

  async function startCheckout() {
    // costruisci items da quelli purchased
    const lines: Array<{ name: string; amount: number; quantity: number }> = [];
    for (const g of grouped) {
      if (!g.purchased) continue;
      const p = products[g.sample.uuid];
      if (!p) continue;
      const priceNum = parseFloat(String(p.price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      lines.push({ name: String(p.name || 'Prodotto'), amount: Math.round(priceNum * 100), quantity: Math.max(1, g.quantity) });
    }
    if (lines.length === 0) return;
    const res = await fetch('/api/checkout/create-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: lines, success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${window.location.origin}/cart` }) });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.url) window.location.assign(data.url);
  }

  // Recent purchases section
  const [recent, setRecent] = React.useState<Array<{ key: string; sample: any; quantity: number }>>([]);
  const [recentProducts, setRecentProducts] = React.useState<Record<string, any>>({});
  const [recentLoading, setRecentLoading] = React.useState(false);
  React.useEffect(() => {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
    const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB as string | undefined;
    const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB as string | undefined;
    if (!user || !dbId || !ordersCol) { setRecent([]); return; }
    (async () => {
      setRecentLoading(true);
      try {
        const res = await databases.listDocuments(dbId, ordersCol, [Query.equal('user_uuid', user.$id), Query.orderDesc('$createdAt'), Query.limit(10)]);
        const items: any[] = [];
        for (const o of res.documents as any[]) {
          const arr = Array.isArray(o.selected_products) ? o.selected_products : [];
          for (const s of arr) {
            try { items.push(typeof s === 'string' ? JSON.parse(s) : s); } catch {}
          }
        }
        // group
        const map = new Map<string, { key: string; sample: any; quantity: number }>();
        for (const it of items) {
          if (!it || !it.uuid) continue;
          const key = `${it.uuid}|${it.color || ''}|${it.personalized || ''}`;
          const cur = map.get(key);
          if (cur) cur.quantity += Number(it.quantity || 0);
          else map.set(key, { key, sample: it, quantity: Number(it.quantity || 0) });
        }
        const groupedRecent = Array.from(map.values());
        setRecent(groupedRecent);
        // fetch product details
        if (productsCol && groupedRecent.length) {
          const uuids = Array.from(new Set(groupedRecent.map(g => g.sample.uuid)));
          const res2 = await databases.listDocuments(dbId, productsCol, [Query.equal('uuid', uuids), Query.limit(100)]);
          const pmap: Record<string, any> = {};
          for (const d of res2.documents as any[]) pmap[String(d.uuid)] = d;
          setRecentProducts(pmap);
        } else {
          setRecentProducts({});
        }
      } catch {
        setRecent([]);
        setRecentProducts({});
      } finally {
        setRecentLoading(false);
      }
    })();
  }, [user]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="bordered" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50" startContent={<ArrowLeft size={16} />} onClick={() => router.back()}>
              Indietro
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Carrello</h1>
          </div>
          <span className="text-sm text-gray-700 font-semibold">{cartCount} articoli</span>
        </div>

        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-gray-700">Il tuo carrello è vuoto.</p>
            <Link href="/#shop">
              <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">Vai allo shop</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: items */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 divide-y divide-gray-100">
              {grouped.map((g) => {
                const p = products[g.sample.uuid];
                const priceNum = p ? (parseFloat(String(p.price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0) : 0;
                const imgSrc = `/api/media/products/${g.sample.uuid}`;
                const isPersonal = !!g.sample.personalized;
                const isPersonalImage = isPersonal && typeof g.sample.personalized === 'string' && g.sample.personalized.startsWith('/api/media/products/');
                const isPersonalText = isPersonal && !isPersonalImage && typeof g.sample.personalized === 'string';
                const color = g.sample.color;
                return (
                  <div key={g.key} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={imgSrc} alt={p?.name || g.sample.uuid} className="w-14 h-14 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                      <div>
                        <div className="font-semibold text-gray-900">{p?.name || `Prodotto ${g.sample.uuid}`}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          {isPersonal ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">
                              {isPersonalImage ? 'Personalizzato: Immagine' : isPersonalText ? `Personalizzato: "${String(g.sample.personalized).slice(0, 16)}${String(g.sample.personalized).length > 16 ? '…' : ''}"` : 'Personalizzato'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">Standard</span>
                          )}
                          {color ? <span className="inline-flex items-center gap-1 text-xs text-gray-700">Colore <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color }} /></span> : null}
                        </div>
                        <div className="text-sm text-gray-700">€{priceNum.toFixed(2)} /EUR</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={g.purchased} onChange={(e) => setPurchased(g.sample.uuid, e.target.checked, g.sample.personalized, g.sample.color)} />
                        Acquista
                      </label>
                      <div className="flex items-center gap-2">
                        <Button variant="bordered" className="h-9 px-3 rounded-full border-gray-400 text-gray-800" onClick={() => updateQuantity(g.sample.uuid, Math.max(0, g.quantity - 1), g.sample.personalized, g.sample.color)}>-</Button>
                        <span className="w-10 text-center font-semibold text-gray-900">x{g.quantity}</span>
                        <Button
                          variant="bordered"
                          className="h-9 px-3 rounded-full border-gray-400 text-gray-800"
                          onClick={() => {
                            const max = Math.max(0, Number(products[g.sample.uuid]?.stock || 0));
                            if (g.quantity + 1 > max) return; // prevent exceeding stock
                            updateQuantity(g.sample.uuid, g.quantity + 1, g.sample.personalized, g.sample.color);
                          }}
                          isDisabled={g.quantity >= Math.max(0, Number(products[g.sample.uuid]?.stock || 0))}
                        >
                          +
                        </Button>
                      </div>
                      <Button variant="bordered" className="h-9 px-3 rounded-full border-red-300 text-red-700" onClick={() => removeItem(g.sample.uuid, g.sample.personalized, g.sample.color)}>Rimuovi</Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Riepilogo</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Subtotale</span>
                    <span className="font-semibold text-gray-900">€{subtotal.toFixed(2)} /EUR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Spedizione</span>
                    <span className="font-semibold text-gray-900">€{shipping.toFixed(2)} /EUR</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Totale</span>
                  <span className="text-base font-bold text-gray-900">€{total.toFixed(2)} /EUR</span>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    className="h-11 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
                    isDisabled={accountLoading || selectedCount === 0}
                    onClick={() => {
                      if (!userInfo || userInfo.shipping_info !== true) {
                        router.push('/shipping-info');
                      } else {
                        startCheckout();
                      }
                    }}
                  >
                    Procedi al checkout
                  </Button>
                  <Button variant="bordered" className="h-11 rounded-full border-gray-400 text-gray-800" onClick={clearCart}>Svuota carrello</Button>
                  <Link href="/#shop">
                    <Button variant="light" className="h-11 rounded-full text-gray-700">Continua lo shopping</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent purchases */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Acquistati di recente</h2>
          {recentLoading ? (
            <div className="text-gray-600">Caricamento…</div>
          ) : recent.length === 0 ? (
            <div className="text-gray-600">Nessun acquisto recente.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 divide-y divide-gray-100">
              {recent.map((g) => {
                const p = recentProducts[g.sample.uuid];
                const imgSrc = `/api/media/products/${g.sample.uuid}`;
                const isPersonal = !!g.sample.personalized;
                const isPersonalImage = isPersonal && typeof g.sample.personalized === 'string' && g.sample.personalized.startsWith('/api/media/products/');
                const isPersonalText = isPersonal && !isPersonalImage && typeof g.sample.personalized === 'string';
                const color = g.sample.color;
                return (
                  <div key={g.key} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={imgSrc} alt={p?.name || g.sample.uuid} className="w-12 h-12 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{p?.name || `Prodotto ${g.sample.uuid}`}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          {isPersonal ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{isPersonalImage ? 'Immagine' : isPersonalText ? `Testo: "${String(g.sample.personalized).slice(0, 16)}${String(g.sample.personalized).length > 16 ? '…' : ''}"` : 'Personalizzato'}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Standard</span>
                          )}
                          {color ? <span className="inline-flex items-center gap-1">Colore <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color }} /></span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">x{g.quantity}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
