"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { databases, ID, Query, storage } from "./auth/appwriteClient";
import { useAccount } from "./AccountContext";

export type CartItem = {
  uuid: string; // product uuid
  quantity: number;
  purchased: boolean;
  personalized?: string; // text or image URL
  color?: string; // selected color
};

function encodeItems(items: CartItem[]): string[] {
  return items.map((i) => JSON.stringify(i));
}

function decodeItems(arr: unknown): CartItem[] {
  if (!Array.isArray(arr)) return [];
  const out: CartItem[] = [];
  for (const v of arr) {
    try {
      const obj = typeof v === "string" ? JSON.parse(v) : v;
      if (obj && typeof obj.uuid === "string") {
        out.push({ uuid: obj.uuid, quantity: Math.max(0, Number(obj.quantity || 0)), purchased: Boolean(obj.purchased), personalized: obj.personalized, color: obj.color });
      }
    } catch {}
  }
  return out;
}

export type CartContextType = {
  cartId: string | null;
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addToCart: (productUuid: string, delta?: number, personalized?: string, color?: string) => Promise<void>;
  updateQuantity: (productUuid: string, quantity: number, personalized?: string, color?: string) => Promise<void>;
  setPurchased: (productUuid: string, purchased: boolean, personalized?: string, color?: string) => Promise<void>;
  removeItem: (productUuid: string, personalized?: string, color?: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cartId: null,
  cartItems: [],
  cartCount: 0,
  loading: false,
  error: null,
  refresh: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  setPurchased: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAccount();
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
  const cartsCol = process.env.NEXT_PUBLIC_APPWRITE_CARTS_DB as string | undefined;
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_STORAGE as string | undefined;

  const cartCount = useMemo(() => cartItems.filter(i => !i.purchased).reduce((a, b) => a + (b.quantity || 0), 0), [cartItems]);

  async function ensureCart(): Promise<string | null> {
    if (!user || !dbId || !cartsCol) { console.error('ensureCart missing user/db/cartsCol'); return null; }
    try {
      const res = await databases.listDocuments(dbId, cartsCol, [Query.equal("user_uuid", user.$id)]);
      if (res.total > 0) {
        const doc = res.documents[0] as any;
        setCartId(doc.$id as string);
        setCartItems(decodeItems(doc.products));
        return doc.$id as string;
      }
      const created = await databases.createDocument(dbId, cartsCol, ID.unique(), {
        user_uuid: String(user.$id).slice(0, 700),
        products: encodeItems([]),
      });
      setCartId(created.$id as string);
      setCartItems([]);
      return created.$id as string;
    } catch (e) {
      console.error('ensureCart error', e);
      setError("Impossibile creare/recuperare il carrello");
      return null;
    }
  }

  const refresh = async () => {
    if (!user || !dbId || !cartsCol) return;
    setLoading(true);
    setError(null);
    try {
      const res = await databases.listDocuments(dbId, cartsCol, [Query.equal("user_uuid", user.$id)]);
      if (res.total > 0) {
        const doc = res.documents[0] as any;
        setCartId(doc.$id as string);
        setCartItems(decodeItems(doc.products));
      } else {
        setCartId(null);
        setCartItems([]);
      }
    } catch (e) {
      setError("Impossibile caricare il carrello");
    } finally {
      setLoading(false);
    }
  };

  const persist = async (items: CartItem[]) => {
    if (!dbId || !cartsCol) { console.error('persist missing db/cartsCol'); return; }
    const id = cartId || (await ensureCart());
    if (!id) return;
    try {
      await databases.updateDocument(dbId, cartsCol, id, { products: encodeItems(items) });
      const res = await databases.listDocuments(dbId, cartsCol, [Query.equal("user_uuid", user!.$id)]);
      if (res.total > 0) {
        const doc = res.documents[0] as any;
        setCartItems(decodeItems(doc.products));
      }
    } catch (e) {
      console.error('persist error', e);
      setError('Errore salvataggio carrello');
    }
  };

  function extractPersonalizedFileId(personalized?: string): string | null {
    if (!personalized) return null;
    if (!personalized.startsWith('/api/media/products/')) return null;
    const parts = personalized.split('/');
    return parts[parts.length - 1] || null;
  }

  const addToCart = async (productUuid: string, delta: number = 1, personalized?: string, color?: string) => {
    if (!user) {
      if (typeof window !== 'undefined') window.location.assign('/auth/login');
      return;
    }
    const id = cartId || (await ensureCart());
    if (!id) return;
    const items = [...cartItems];
    const idx = items.findIndex((i) => i.uuid === productUuid && !i.purchased && i.personalized === personalized && i.color === color);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: Math.max(1, (items[idx].quantity || 0) + delta) };
    } else {
      items.push({ uuid: productUuid, quantity: Math.max(1, delta), purchased: false, personalized, color });
    }
    setCartItems(items);
    await persist(items);
  };

  const updateQuantity = async (productUuid: string, quantity: number, personalized?: string, color?: string) => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    let items = [...cartItems];
    const idx = items.findIndex((i) => i.uuid === productUuid && !i.purchased && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color));
    if (idx >= 0) {
      if (quantity <= 0) {
        // if removing an item with personalized image, delete the file from storage
        const fileId = extractPersonalizedFileId(items[idx].personalized);
        if (bucketId && fileId) {
          try { await storage.deleteFile(bucketId, fileId); } catch (e) { console.error('delete personalized file error', e); }
        }
        items.splice(idx, 1);
      } else {
        items[idx] = { ...items[idx], quantity };
      }
      setCartItems(items);
      await persist(items);
    }
  };

  const setPurchased = async (productUuid: string, purchased: boolean, personalized?: string, color?: string) => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    const items = cartItems.map((i) => (i.uuid === productUuid && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color) ? { ...i, purchased } : i));
    setCartItems(items);
    await persist(items);
  };

  const removeItem = async (productUuid: string, personalized?: string, color?: string) => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    const toRemove = cartItems.filter((i) => (i.uuid === productUuid && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color)));
    if (bucketId) {
      for (const it of toRemove) {
        const fileId = extractPersonalizedFileId(it.personalized);
        if (fileId) {
          try { await storage.deleteFile(bucketId, fileId); } catch (e) { console.error('delete personalized file error', e); }
        }
      }
    }
    const items = cartItems.filter((i) => !(i.uuid === productUuid && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color)));
    setCartItems(items);
    await persist(items);
  };

  const clearCart = async () => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    if (bucketId) {
      for (const it of cartItems) {
        const fileId = extractPersonalizedFileId(it.personalized);
        if (fileId) {
          try { await storage.deleteFile(bucketId, fileId); } catch (e) { console.error('delete personalized file error', e); }
        }
      }
    }
    const items: CartItem[] = [];
    setCartItems(items);
    await persist(items);
  };

  useEffect(() => {
    setCartItems([]);
    setCartId(null);
    setError(null);
    if (user) {
      refresh();
    }
  }, [user]);

  return (
    <CartContext.Provider value={{ cartId, cartItems, cartCount, loading, error, refresh, addToCart, updateQuantity, setPurchased, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
