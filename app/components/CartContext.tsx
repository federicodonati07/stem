"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase, CARTS_DB, PRODUCTS_STORAGE, generateId } from "./auth/supabaseClient";
import { useAccount } from "./AccountContext";

export type CartItem = {
  uuid: string; // product uuid
  quantity: number;
  purchased: boolean;
  personalized?: string; // text or image URL
  color?: string; // selected color
  size?: string; // selected size
};

export type CartContextType = {
  cartId: string | null;
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addToCart: (productUuid: string, delta?: number, personalized?: string, color?: string, size?: string) => Promise<void>;
  updateQuantity: (productUuid: string, quantity: number, personalized?: string, color?: string, size?: string) => Promise<void>;
  setPurchased: (productUuid: string, purchased: boolean, personalized?: string, color?: string, size?: string) => Promise<void>;
  removeItem: (productUuid: string, personalized?: string, color?: string, size?: string) => Promise<void>;
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

  const cartCount = useMemo(() => cartItems.filter(i => !i.purchased).reduce((a, b) => a + (b.quantity || 0), 0), [cartItems]);

  async function ensureCart(): Promise<string | null> {
    if (!user) { 
      console.error('ensureCart missing user'); 
      return null; 
    }
    
    try {
      // Check if cart exists for this user
      const { data: existingCarts, error: fetchError } = await supabase
        .from(CARTS_DB)
        .select('*')
        .eq('user_uuid', user.$id)
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching cart:', fetchError);
        setError("Impossibile recuperare il carrello");
        return null;
      }
      
      if (existingCarts && existingCarts.length > 0) {
        const cart = existingCarts[0];
        setCartId(cart.id?.toString());
        // In Supabase, products is now a JSONB field, not an array of strings
        const products = Array.isArray(cart.products) ? cart.products : [];
        setCartItems(products);
        return cart.id?.toString();
      }
      
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from(CARTS_DB)
        .insert({
          user_uuid: user.$id,
          products: [],
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating cart:', createError);
        setError("Impossibile creare il carrello");
        return null;
      }
      
      setCartId(newCart.id?.toString());
      setCartItems([]);
      return newCart.id?.toString();
    } catch (e) {
      console.error('ensureCart error', e);
      setError("Impossibile creare/recuperare il carrello");
      return null;
    }
  }

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const { data: carts, error: fetchError } = await supabase
        .from(CARTS_DB)
        .select('*')
        .eq('user_uuid', user.$id)
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching cart:', fetchError);
        setError("Impossibile caricare il carrello");
        return;
      }
      
      if (carts && carts.length > 0) {
        const cart = carts[0];
        setCartId(cart.id?.toString());
        const products = Array.isArray(cart.products) ? cart.products : [];
        setCartItems(products);
      } else {
        setCartId(null);
        setCartItems([]);
      }
    } catch (e) {
      console.error('refresh error', e);
      setError("Impossibile caricare il carrello");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const persist = async (items: CartItem[]) => {
    const id = cartId || (await ensureCart());
    if (!id) return;
    
    try {
      const { error: updateError } = await supabase
        .from(CARTS_DB)
        .update({ products: items })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating cart:', updateError);
        setError('Errore salvataggio carrello');
        return;
      }
      
      // Refresh to get the latest state
      const { data: cart, error: fetchError } = await supabase
        .from(CARTS_DB)
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated cart:', fetchError);
        return;
      }
      
      if (cart) {
        const products = Array.isArray(cart.products) ? cart.products : [];
        setCartItems(products);
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

  const addToCart = async (productUuid: string, delta: number = 1, personalized?: string, color?: string, size?: string) => {
    if (!user) {
      if (typeof window !== 'undefined') window.location.assign('/auth/login');
      return;
    }
    const id = cartId || (await ensureCart());
    if (!id) return;
    
    const items = [...cartItems];
    const idx = items.findIndex((i) => i.uuid === productUuid && !i.purchased && i.personalized === personalized && i.color === color && i.size === size);
    
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: Math.max(1, (items[idx].quantity || 0) + delta) };
    } else {
      items.push({ uuid: productUuid, quantity: Math.max(1, delta), purchased: false, personalized, color, size });
    }
    
    setCartItems(items);
    await persist(items);
  };

  const updateQuantity = async (productUuid: string, quantity: number, personalized?: string, color?: string, size?: string) => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    
    const items = [...cartItems];
    const idx = items.findIndex((i) => i.uuid === productUuid && !i.purchased && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color) && (size === undefined || i.size === size));
    
    if (idx >= 0) {
      if (quantity <= 0) {
        // Delete personalized file if exists
        const fileId = extractPersonalizedFileId(items[idx].personalized);
        if (fileId) {
          try { 
            await supabase.storage.from(PRODUCTS_STORAGE).remove([fileId]); 
          } catch (e) { 
            console.error('delete personalized file error', e); 
          }
        }
        items.splice(idx, 1);
      } else {
        items[idx] = { ...items[idx], quantity };
      }
      setCartItems(items);
      await persist(items);
    }
  };

  const setPurchased = async (productUuid: string, purchased: boolean, personalized?: string, color?: string, size?: string) => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    
    const items = cartItems.map((i) => (i.uuid === productUuid && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color) && (size === undefined || i.size === size) ? { ...i, purchased } : i));
    setCartItems(items);
    await persist(items);
  };

  const removeItem = async (productUuid: string, personalized?: string, color?: string, size?: string) => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    
    const toRemove = cartItems.filter((i) => (i.uuid === productUuid && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color) && (size === undefined || i.size === size)));
    
    // Delete personalized files
    for (const it of toRemove) {
      const fileId = extractPersonalizedFileId(it.personalized);
      if (fileId) {
        try { 
          await supabase.storage.from(PRODUCTS_STORAGE).remove([fileId]); 
        } catch (e) { 
          console.error('delete personalized file error', e); 
        }
      }
    }
    
    const items = cartItems.filter((i) => !(i.uuid === productUuid && (personalized === undefined || i.personalized === personalized) && (color === undefined || i.color === color) && (size === undefined || i.size === size)));
    setCartItems(items);
    await persist(items);
  };

  const clearCart = async () => {
    if (!user) return;
    const id = cartId || (await ensureCart());
    if (!id) return;
    
    // Delete all personalized files
    for (const it of cartItems) {
      const fileId = extractPersonalizedFileId(it.personalized);
      if (fileId) {
        try { 
          await supabase.storage.from(PRODUCTS_STORAGE).remove([fileId]); 
        } catch (e) { 
          console.error('delete personalized file error', e); 
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
  }, [user, refresh]);

  return (
    <CartContext.Provider value={{ cartId, cartItems, cartCount, loading, error, refresh, addToCart, updateQuantity, setPurchased, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
