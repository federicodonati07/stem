"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "../../components/AccountContext";
import { supabase, CARTS_DB, ORDERS_DB, PRODUCTS_DB, generateId } from "../../components/auth/supabaseClient";

type PurchasedItem = { uuid: string; personalized?: string; color?: string; quantity?: number; purchased?: boolean };
type Consolidated = { uuid: string; personalized?: string; color?: string; quantity: number; purchased: true; unit_price: string };

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAccount();
  const [err, setErr] = React.useState<string | null>(null);
  const didRunRef = React.useRef(false);

  React.useEffect(() => {
    if (didRunRef.current) return; // evita doppia esecuzione in Strict Mode
    didRunRef.current = true;
    (async () => {
      const sid = params.get('session_id');
      if (!sid || !user) { 
        setErr('Parametri mancanti'); 
        return; 
      }
      
      try {
        // 0) Idempotenza: se esiste già un ordine per questa sessione e utente, non crearne un altro
        const { data: existingOrders, error: checkError } = await supabase
          .from(ORDERS_DB)
          .select('*')
          .eq('bill', sid.toString().slice(0, 100))
          .eq('user_uuid', user.$id)
          .limit(1);
        
        if (checkError) {
          console.error('Error checking existing orders:', checkError);
        }
        
        if (existingOrders && existingOrders.length > 0) {
          // Ordine già creato, redirect diretto
          router.push('/orders');
          return;
        }

        // 1) Recupera carrello dell'utente
        const { data: carts, error: cartError } = await supabase
          .from(CARTS_DB)
          .select('*')
          .eq('user_uuid', user.$id)
          .limit(1);
        
        if (cartError || !carts || carts.length === 0) { 
          setErr('Carrello non trovato'); 
          return; 
        }
        
        const cart = carts[0];
        const itemsRaw = Array.isArray(cart.products) ? cart.products : [];
        const parsed = itemsRaw.filter(Boolean) as PurchasedItem[];

        // 2) Seleziona solo quelli marcati purchased === true
        const purchasedItems = parsed.filter((it) => it && it.purchased === true) as PurchasedItem[];
        if (purchasedItems.length === 0) { 
          setErr('Nessun prodotto selezionato per acquisto'); 
          return; 
        }

        // 2b) Recupera prezzo corrente dei prodotti per salvarlo come prezzo di acquisto
        const priceMap: Record<string, number> = {};
        try {
          const uuids = Array.from(new Set(purchasedItems.map((it) => String(it.uuid))));
          if (uuids.length) {
            const { data: products, error: productsError } = await supabase
              .from(PRODUCTS_DB)
              .select('*')
              .in('uuid', uuids)
              .limit(200);
            
            if (productsError) {
              console.error('Error fetching products:', productsError);
            } else if (products) {
              for (const d of products) {
                const priceVal = (typeof d.price === 'number' || typeof d.price === 'string') ? d.price : '';
                const n = parseFloat(String(priceVal).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                priceMap[String(d.uuid)] = n;
              }
            }
          }
        } catch (e) {
          console.error('Error fetching product prices:', e);
        }

        // 3) Raggruppa per uuid + personalized + color includendo unit_price
        const groupMap = new Map<string, Consolidated>();
        for (const it of purchasedItems) {
          const key = `${it.uuid}|${it.personalized || ''}|${it.color || ''}`;
          const cur = groupMap.get(key);
          const unitPrice = priceMap[String(it.uuid)] ?? 0;
          if (cur) {
            cur.quantity = (cur.quantity || 0) + (Number(it.quantity) || 0);
          } else {
            groupMap.set(key, { 
              uuid: String(it.uuid), 
              personalized: it.personalized, 
              color: it.color, 
              quantity: Number(it.quantity) || 0, 
              purchased: true, 
              unit_price: unitPrice.toFixed(2) 
            });
          }
        }
        
        const consolidated = Array.from(groupMap.values());
        
        // Calcola totale in EUR (somma quantità x unit_price)
        let orderTotal = 0;
        for (const it of consolidated) {
          const qty = Number(it.quantity) || 0;
          const unit = parseFloat(String(it.unit_price));
          orderTotal += (Number.isFinite(unit) ? unit : 0) * qty;
        }

        // 4) Crea UN ordine con tutti i prodotti consolidati
        const orderId = generateId();
        const { error: createError } = await supabase
          .from(ORDERS_DB)
          .insert({
            status: 'pagato',
            user_uuid: String(user.$id).slice(0, 700),
            order_uuid: orderId,
            bill: orderTotal.toFixed(2),
            selected_products: consolidated,
          });
        
        if (createError) {
          console.error('Error creating order:', createError);
          setErr('Errore creazione ordine');
          return;
        }

        // 5) Aggiorna carrello: rimuovi gli item acquistati
        const remaining = parsed.filter((it) => !(it && it.purchased === true)) as PurchasedItem[];
        const { error: updateError } = await supabase
          .from(CARTS_DB)
          .update({ products: remaining })
          .eq('id', cart.id);
        
        if (updateError) {
          console.error('Error updating cart:', updateError);
        }

        // 6) Redirect automatico alla pagina ordini
        router.push('/orders');
      } catch (e) {
        console.error('Error finalizing order:', e);
        setErr('Errore finalizzazione ordine');
      }
    })();
  }, [params, user]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-12 max-w-md w-full text-center">
        {err ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Errore</h1>
            <p className="text-red-600 mb-6 font-medium">{err}</p>
            <button 
              className="h-12 px-6 rounded-xl border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-all" 
              onClick={() => router.push('/cart')}
            >
              Torna al carrello
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 animate-spin">
              <div className="w-full h-full border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Finalizzazione ordine...</h1>
            <p className="text-gray-600">Verrai reindirizzato tra pochi secondi</p>
          </>
        )}
      </div>
    </main>
  );
}

