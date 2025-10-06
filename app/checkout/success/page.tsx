"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "../../components/AccountContext";
import { databases, Query, ID } from "../../components/auth/appwriteClient";

type CartDoc = { $id: string; products?: unknown[] };
type PurchasedItem = { uuid: string; personalized?: string; color?: string; quantity?: number; purchased?: boolean };
type Consolidated = { uuid: string; personalized?: string; color?: string; quantity: number; purchased: true; unit_price: string };
type EmailItem = { uuid: string; quantity: number; unit_price: string | number; color?: string; personalized?: string };

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAccount();
  const [ok, setOk] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const didRunRef = React.useRef(false);

  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
  const cartsCol = process.env.NEXT_PUBLIC_APPWRITE_CARTS_DB as string | undefined;
  const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB as string | undefined;
  const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB as string | undefined;

  React.useEffect(() => {
    if (didRunRef.current) return; // evita doppia esecuzione in Strict Mode
    didRunRef.current = true;
    (async () => {
      const sid = params.get('session_id');
      if (!sid || !dbId || !cartsCol || !ordersCol || !user) { setErr('Parametri mancanti'); return; }
      try {
        // 0) Idempotenza: se esiste già un ordine per questa sessione e utente, non crearne un altro
        const existing = await databases.listDocuments(dbId, ordersCol, [
          Query.equal('bill', sid.toString().slice(0, 100)),
          Query.equal('user_uuid', user.$id),
          Query.limit(1)
        ]);
        if ((existing.total || 0) > 0) {
          setOk(true);
          return;
        }

        // 1) Recupera carrello dell'utente
        const res = await databases.listDocuments(dbId, cartsCol, [Query.equal('user_uuid', user.$id), Query.limit(1)]);
        if (res.total === 0) { setErr('Carrello non trovato'); return; }
        const cart = res.documents[0] as CartDoc;
        const itemsRaw = Array.isArray(cart.products) ? cart.products : [];
        const parsed = itemsRaw.map((s: unknown) => {
          try { return typeof s === 'string' ? JSON.parse(s as string) : s; } catch { return null; }
        }).filter(Boolean) as PurchasedItem[];

        // 2) Seleziona solo quelli marcati purchased === true
        const purchasedItems = parsed.filter((it) => it && it.purchased === true) as PurchasedItem[];
        if (purchasedItems.length === 0) { setErr('Nessun prodotto selezionato per acquisto'); return; }

        // 2b) Recupera prezzo corrente dei prodotti per salvarlo come prezzo di acquisto
        const priceMap: Record<string, number> = {};
        try {
          if (productsCol) {
            const uuids = Array.from(new Set(purchasedItems.map((it) => String(it.uuid))));
            if (uuids.length) {
              const pr = await databases.listDocuments(dbId, productsCol, [Query.equal('uuid', uuids), Query.limit(200)]);
              const docs = (pr.documents as unknown[]) as Array<Record<string, unknown>>;
              for (const d of docs) {
                const priceVal = (typeof d.price === 'number' || typeof d.price === 'string') ? d.price : '';
                const n = parseFloat(String(priceVal).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                priceMap[String(d.uuid as string)] = n;
              }
            }
          }
        } catch {}

        // 3) Raggruppa per uuid + personalized + color includendo unit_price
        const groupMap = new Map<string, Consolidated>();
        for (const it of purchasedItems) {
          const key = `${it.uuid}|${it.personalized || ''}|${it.color || ''}`;
          const cur = groupMap.get(key);
          const unitPrice = priceMap[String(it.uuid)] ?? 0;
          if (cur) {
            cur.quantity = (cur.quantity || 0) + (Number(it.quantity) || 0);
          } else {
            groupMap.set(key, { uuid: String(it.uuid), personalized: it.personalized, color: it.color, quantity: Number(it.quantity) || 0, purchased: true, unit_price: unitPrice.toFixed(2) });
          }
        }
        const consolidated = Array.from(groupMap.values()).map((it) => JSON.stringify(it));
        // Calcola totale in EUR (somma quantità x unit_price)
        let orderTotal = 0;
        for (const it of groupMap.values()) {
          const qty = Number(it.quantity) || 0;
          const unit = parseFloat(String(it.unit_price));
          orderTotal += (Number.isFinite(unit) ? unit : 0) * qty;
        }

        // 4) Crea UN ordine con tutti i prodotti consolidati
        const orderId = ID.unique();
        await databases.createDocument(dbId, ordersCol, orderId, {
          status: 'pagato',
          user_uuid: String(user.$id).slice(0, 700),
          order_uuid: orderId,
          bill: orderTotal.toFixed(2),
          selected_products: consolidated,
        });

        // (rimosso) gestione stock su checkout

        // 5) Aggiorna carrello: rimuovi gli item acquistati
        const remaining = parsed.filter((it) => !(it && (it as PurchasedItem).purchased === true)) as PurchasedItem[];
        await databases.updateDocument(dbId, cartsCol, cart.$id, { products: remaining.map((it) => JSON.stringify(it)) });

        // 6) Invia email al cliente e all'admin
        try {
          const emailItems: EmailItem[] = Array.from(groupMap.values()).map((it) => ({ uuid: it.uuid, quantity: it.quantity, unit_price: it.unit_price, color: it.color, personalized: it.personalized }));
          await fetch('/api/orders/send-emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_uuid: orderId, user_uuid: user.$id, items: emailItems, total: orderTotal }) });
        } catch {}

        setOk(true);
      } catch {
        setErr('Errore finalizzazione ordine');
      }
    })();
  }, [params, user, dbId, cartsCol, ordersCol, productsCol]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
        {ok ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento completato</h1>
            <p className="text-gray-700 mb-6">Grazie per l&apos;ordine! A breve riceverai una conferma via email.</p>
            <button className="h-11 px-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" onClick={() => router.push('/orders')}>
              Vai ai miei ordini
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Stiamo finalizzando…</h1>
            {err ? <p className="text-red-600 mb-6">{err}</p> : <p className="text-gray-700 mb-6">Attendere qualche secondo…</p>}
            <button className="h-11 px-6 rounded-full border border-gray-300" onClick={() => router.push('/cart')}>
              Torna al carrello
            </button>
          </>
        )}
      </div>
    </main>
  );
}
