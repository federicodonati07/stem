"use client";

import React from "react";
import { useCart } from "../components/CartContext";
import Link from "next/link";
import { Button } from "@heroui/react";

export default function CartPage() {
  const { cartItems, cartCount, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Carrello</h1>
          <span className="text-sm text-gray-600">{cartCount} articoli</span>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-gray-700">Il tuo carrello è vuoto.</p>
            <Link href="/#shop">
              <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">Vai allo shop</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div key={item.uuid} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900">Prodotto {item.uuid}</div>
                  <div className="text-sm text-gray-600">Acquistato: {item.purchased ? 'Sì' : 'No'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="bordered" className="rounded-full" onClick={() => updateQuantity(item.uuid, Math.max(0, (item.quantity || 0) - 1))}>-</Button>
                  <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                  <Button variant="bordered" className="rounded-full" onClick={() => updateQuantity(item.uuid, (item.quantity || 0) + 1)}>+</Button>
                  <Button variant="bordered" className="rounded-full border-red-300 text-red-700" onClick={() => removeItem(item.uuid)}>Rimuovi</Button>
                </div>
              </div>
            ))}
            <div className="pt-4 flex items-center justify-between">
              <Button variant="bordered" className="rounded-full" onClick={clearCart}>Svuota carrello</Button>
              <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">Procedi al checkout</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
