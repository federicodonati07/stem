"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { useCart } from "../components/CartContext";
import Link from "next/link";
import { Button } from "@heroui/react";
import { supabase, PRODUCTS_DB, ORDERS_DB } from "../components/auth/supabaseClient";
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Package, CreditCard, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from "../components/AccountContext";

type ProductDoc = {
  uuid: string;
  name?: string;
  price: string | number;
  stock?: number;
};

type CartLineItem = {
  uuid: string;
  quantity?: number;
  purchased?: boolean;
  color?: string;
  personalized?: string;
  sizes?: string;
};

export default function CartPage() {
  const { cartItems, cartCount, updateQuantity, removeItem, clearCart, setPurchased } = useCart();
  const router = useRouter();
  const { user, userInfo, loading: accountLoading } = useAccount();

  // Build product details map (cart)
  const [products, setProducts] = React.useState<Record<string, ProductDoc>>({});
  React.useEffect(() => {
    const uuids = Array.from(new Set(cartItems.map(i => i.uuid)));
    if (uuids.length === 0) { setProducts({}); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from(PRODUCTS_DB)
          .select('*')
          .in('uuid', uuids)
          .limit(100);
        
        if (error) {
          console.error('Error fetching products:', error);
          setProducts({});
          return;
        }
        
        const map: Record<string, ProductDoc> = {};
        for (const d of (data || [])) {
          const uuid = typeof d.uuid === 'string' ? d.uuid : '';
          if (!uuid) continue;
          const name = typeof d.name === 'string' ? d.name : undefined;
          const price = (typeof d.price === 'string' || typeof d.price === 'number') ? (d.price as string | number) : '0';
          const stock = typeof d.stock === 'number' ? d.stock : Number(d.stock ?? 0);
          map[uuid] = { uuid, name, price, stock };
        }
        setProducts(map);
      } catch {
        setProducts({});
      }
    })();
  }, [cartItems]);

  // Group identical items by uuid+color+personalized (cart)
  const grouped = React.useMemo(() => {
    const acc = new Map<string, { key: string; sample: CartLineItem; quantity: number; purchased: boolean }>();
    for (const iRaw of cartItems as unknown as CartLineItem[]) {
      const i: CartLineItem = {
        uuid: String(iRaw.uuid),
        quantity: Number(iRaw.quantity || 0),
        purchased: !!iRaw.purchased,
        color: typeof iRaw.color === 'string' ? iRaw.color : undefined,
        personalized: typeof iRaw.personalized === 'string' ? iRaw.personalized : undefined,
        sizes: typeof iRaw.sizes === 'string' ? iRaw.sizes : undefined,
      };
      const key = `${i.uuid}|${i.color || ''}|${i.personalized || ''}|${i.sizes || ''}`;
      const cur = acc.get(key);
      if (cur) {
        cur.quantity += i.quantity || 0;
        cur.purchased = cur.purchased && !!i.purchased;
      } else {
        acc.set(key, { key, sample: i, quantity: i.quantity || 0, purchased: !!i.purchased });
      }
    }
    return Array.from(acc.values());
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

  const shipping = React.useMemo(() => {
    return subtotal * 0.015; // 1.5% del subtotale
  }, [subtotal]);
  
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
  const [recent, setRecent] = React.useState<Array<{ key: string; sample: CartLineItem; quantity: number }>>([]);
  const [recentProducts, setRecentProducts] = React.useState<Record<string, ProductDoc>>({});
  const [recentLoading, setRecentLoading] = React.useState(false);
  React.useEffect(() => {
    if (!user) { setRecent([]); return; }
    (async () => {
      setRecentLoading(true);
      try {
        const { data: orders, error: ordersError } = await supabase
          .from(ORDERS_DB)
          .select('*')
          .eq('user_uuid', user.$id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (ordersError) {
          console.error('Error fetching recent orders:', ordersError);
          setRecent([]);
          setRecentProducts({});
          setRecentLoading(false);
          return;
        }
        
        const items: CartLineItem[] = [];
        for (const o of (orders || [])) {
          const arr = Array.isArray(o.selected_products) ? o.selected_products : [];
          for (const s of arr) {
            try {
              if (s && typeof s === 'object' && 'uuid' in s) {
                const so = s as Record<string, unknown>;
                items.push({
                  uuid: String(so.uuid),
                  quantity: Number(so.quantity || 0),
                  color: typeof so.color === 'string' ? String(so.color) : undefined,
                  personalized: typeof so.personalized === 'string' ? String(so.personalized) : undefined,
                });
              }
            } catch {}
          }
        }
        
        // group
        const map = new Map<string, { key: string; sample: CartLineItem; quantity: number }>();
        for (const it of items) {
          if (!it || !it.uuid) continue;
          const key = `${it.uuid}|${it.color || ''}|${it.personalized || ''}|${it.sizes || ''}`;
          const cur = map.get(key);
          if (cur) cur.quantity += Number(it.quantity || 0);
          else map.set(key, { key, sample: it, quantity: Number(it.quantity || 0) });
        }
        const groupedRecent = Array.from(map.values());
        setRecent(groupedRecent);
        
        // fetch product details
        if (groupedRecent.length) {
          const uuids = Array.from(new Set(groupedRecent.map(g => g.sample.uuid)));
          const { data: productsData, error: productsError } = await supabase
            .from(PRODUCTS_DB)
            .select('*')
            .in('uuid', uuids)
            .limit(100);
          
          if (productsError) {
            console.error('Error fetching products:', productsError);
            setRecentProducts({});
          } else {
            const pmap: Record<string, ProductDoc> = {};
            for (const d of (productsData || [])) {
              const uuid = typeof d.uuid === 'string' ? d.uuid : '';
              if (!uuid) continue;
              const name = typeof d.name === 'string' ? d.name : undefined;
              const price = (typeof d.price === 'string' || typeof d.price === 'number') ? (d.price as string | number) : '0';
              const stock = typeof d.stock === 'number' ? d.stock : Number(d.stock ?? 0);
              pmap[uuid] = { uuid, name, price, stock };
            }
            setRecentProducts(pmap);
          }
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="light" 
            className="mb-4 text-gray-700 hover:text-purple-600 -ml-2" 
            startContent={<ArrowLeft size={20} />} 
            onClick={() => router.back()}
          >
            Torna allo shop
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Il tuo carrello</h1>
                <p className="text-sm text-gray-600">{cartCount} {cartCount === 1 ? 'articolo' : 'articoli'} nel carrello</p>
              </div>
            </div>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-12 text-center shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ShoppingBag size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Il carrello è vuoto</h3>
            <p className="text-gray-600 mb-6">Aggiungi prodotti per iniziare</p>
            <Link href="/#shop">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
                startContent={<ShoppingCart size={20} />}
              >
                Vai allo shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: items */}
            <div className="lg:col-span-2 space-y-4">
              {grouped.map((g) => {
                const p = products[g.sample.uuid];
                const priceNum = p ? (parseFloat(String(p.price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0) : 0;
                const imgSrc = `/api/media/products/${g.sample.uuid}`;
                const isPersonal = !!g.sample.personalized;
                const isPersonalImage = isPersonal && typeof g.sample.personalized === 'string' && (g.sample.personalized.startsWith('/api/media/products/') || g.sample.personalized.startsWith('client_customization/'));
                const isPersonalText = isPersonal && !isPersonalImage && typeof g.sample.personalized === 'string';
                const color = g.sample.color;
                return (
                  <div key={g.key} className={`bg-white rounded-2xl border-2 p-5 transition-all duration-300 ${g.purchased ? 'border-purple-300 shadow-lg shadow-purple-100' : 'border-gray-200 shadow-md hover:shadow-lg'}`}>
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <label className="flex items-center pt-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={g.purchased} 
                          onChange={(e) => setPurchased(g.sample.uuid, e.target.checked, g.sample.personalized, g.sample.color, g.sample.sizes)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        />
                      </label>

                      {/* Image */}
                      <div className="relative">
                        <img 
                          src={imgSrc} 
                          alt={p?.name || g.sample.uuid} 
                          className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 shadow-sm" 
                          onError={(e) => { 
                            (e.currentTarget as HTMLImageElement).onerror = null; 
                            (e.currentTarget as HTMLImageElement).src = '/window.svg'; 
                            (e.currentTarget as HTMLImageElement).className = 'w-24 h-24 rounded-xl object-contain border-2 border-gray-200'; 
                          }} 
                        />
                        {g.purchased && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{p?.name || `Prodotto ${g.sample.uuid}`}</h3>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {isPersonal && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold">
                              ✨ {isPersonalImage ? 'Immagine personalizzata' : isPersonalText ? `"${String(g.sample.personalized).slice(0, 20)}${String(g.sample.personalized).length > 20 ? '…' : ''}"` : 'Personalizzato'}
                            </span>
                          )}
                          {color && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                              <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                              Colore
                            </span>
                          )}
                          {g.sample.sizes && (
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                              📏 Taglia: {g.sample.sizes}
                            </span>
                          )}
                        </div>

                        {/* Price and Quantity Controls */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {/* Quantity */}
                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                              <Button 
                                isIconOnly
                                size="sm"
                                className="w-8 h-8 rounded-lg bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors" 
                                onClick={() => updateQuantity(g.sample.uuid, Math.max(0, g.quantity - 1), g.sample.personalized, g.sample.color, g.sample.sizes)}
                              >
                                <Minus size={14} />
                              </Button>
                              <span className="w-12 text-center font-bold text-gray-900">{g.quantity}</span>
                              <Button
                                isIconOnly
                                size="sm"
                                className="w-8 h-8 rounded-lg bg-white hover:bg-green-50 text-gray-700 hover:text-green-600 transition-colors"
                                onClick={() => {
                                  const max = Math.max(0, Number(products[g.sample.uuid]?.stock || 0));
                                  if (g.quantity + 1 > max) return;
                                  updateQuantity(g.sample.uuid, g.quantity + 1, g.sample.personalized, g.sample.color, g.sample.sizes);
                                }}
                                isDisabled={g.quantity >= Math.max(0, Number(products[g.sample.uuid]?.stock || 0))}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>

                            {/* Price */}
                            <div className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                              €{(priceNum * g.quantity).toFixed(2)}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button 
                            isIconOnly
                            variant="light" 
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            onClick={() => removeItem(g.sample.uuid, g.sample.personalized, g.sample.color, g.sample.sizes)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl sticky top-24">
                {/* Header */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-t-2xl p-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package size={24} />
                    Riepilogo ordine
                  </h2>
                  <p className="text-purple-100 text-sm mt-1">{selectedCount} {selectedCount === 1 ? 'articolo selezionato' : 'articoli selezionati'}</p>
                </div>

                {/* Summary Details */}
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <ShoppingBag size={18} className="text-gray-500" />
                        Subtotale
                      </span>
                      <span className="font-bold text-gray-900">€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium flex items-center gap-2">
                          <Truck size={18} className="text-blue-600" />
                          Spedizione
                        </span>
                        <span className="text-xs text-gray-500 ml-6">(1,5% del subtotale)</span>
                      </div>
                      <span className="font-bold text-gray-900">€{shipping.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Totale</p>
                        <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                          €{total.toFixed(2)}
                        </p>
                      </div>
                      <CreditCard size={32} className="text-purple-600" />
                    </div>
                  </div>

                  {/* Info Message */}
                  {selectedCount === 0 && grouped.length > 0 && (
                    <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-700 font-medium text-center">
                        💡 Seleziona gli articoli con la checkbox per procedere al pagamento
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <Button
                      size="lg"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      isDisabled={accountLoading || selectedCount === 0}
                      onClick={() => {
                        if (!userInfo || userInfo?.shipping_info !== true) {
                          router.push('/shipping-info');
                        } else {
                          startCheckout();
                        }
                      }}
                    >
                      {selectedCount === 0 ? '🛒 Seleziona articoli' : `💳 Procedi al pagamento (${selectedCount})`}
                    </Button>
                    <Button 
                      variant="bordered" 
                      className="w-full h-11 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 font-semibold transition-all" 
                      onClick={clearCart}
                      startContent={<Trash2 size={18} />}
                    >
                      Svuota carrello
                    </Button>
                    <Link href="/#shop" className="block">
                      <Button 
                        variant="light" 
                        className="w-full h-11 rounded-xl text-gray-700 hover:bg-gray-100 font-medium"
                        startContent={<ShoppingCart size={18} />}
                      >
                        Continua lo shopping
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent purchases */}
        {recent.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Acquistati di recente</h2>
                <p className="text-sm text-gray-600">I tuoi ultimi acquisti</p>
              </div>
            </div>
            
            {recentLoading ? (
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600">Caricamento…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recent.map((g) => {
                  const p = recentProducts[g.sample.uuid];
                  const imgSrc = `/api/media/products/${g.sample.uuid}`;
                  const isPersonal = !!g.sample.personalized;
                  const isPersonalImage = isPersonal && typeof g.sample.personalized === 'string' && g.sample.personalized.startsWith('/api/media/products/');
                  const isPersonalText = isPersonal && !isPersonalImage && typeof g.sample.personalized === 'string';
                  const color = g.sample.color;
                  return (
                    <div key={g.key} className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:shadow-lg transition-all hover:border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={imgSrc} 
                          alt={p?.name || g.sample.uuid} 
                          className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200" 
                          onError={(e) => { 
                            (e.currentTarget as HTMLImageElement).onerror = null; 
                            (e.currentTarget as HTMLImageElement).src = '/window.svg'; 
                          }} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm line-clamp-2">{p?.name || `Prodotto ${g.sample.uuid}`}</div>
                          <div className="text-xs text-gray-500 font-semibold mt-1">Quantità: {g.quantity}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {isPersonal && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold">
                            ✨ {isPersonalImage ? 'Personalizzato' : isPersonalText ? `"${String(g.sample.personalized).slice(0, 12)}…"` : 'Custom'}
                          </span>
                        )}
                        {color && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                            <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color }} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
