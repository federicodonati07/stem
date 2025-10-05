"use client";
import { useAccount } from "./components/AccountContext";
import { useEffect, useState } from "react";
import { databases, Query } from "./components/auth/appwriteClient";
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import CustomizeSection from './components/CustomizeSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';

export default function HomePage() {
  const { user, loading, refresh, isAdmin } = useAccount() as any;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Rimuovi il parametro oauth dalla URL se presente
    const url = new URL(window.location.href);
    if (url.searchParams.get("oauth") === "1") {
      url.searchParams.delete("oauth");
      window.history.replaceState({}, "", url.toString());
    }
    
    // Pulisci il flag di processing se presente
    localStorage.removeItem('user_info_processing');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!isAdmin) { setPendingCount(0); return; }
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
        const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB as string | undefined;
        if (!dbId || !ordersCol) { setPendingCount(0); return; }
        const res = await databases.listDocuments(dbId, ordersCol, [Query.equal('status', 'pagato'), Query.limit(1)]);
        setPendingCount(Number(res.total || 0));
      } catch {
        setPendingCount(0);
      }
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && user && typeof window !== "undefined" && window.location.hash === "#_=_") {
      // Forza reload dopo login Google
      window.location.hash = "";
      window.location.reload();
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {isAdmin && pendingCount > 0 ? (
          <div className="fixed top-16 left-0 right-0 z-40 bg-red-600 border-b border-red-700 text-white text-sm py-2 px-4 text-center shadow">
            Hai {pendingCount} ordini pagati da controllare
          </div>
        ) : null}
        <Hero />
        <ProductGrid />
        <CustomizeSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
