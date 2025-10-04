"use client";
import { useAccount } from "./components/AccountContext";
import { useEffect } from "react";
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import CustomizeSection from './components/CustomizeSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';

export default function HomePage() {
  const { user, loading, refresh } = useAccount();

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
        <Hero />
        <ProductGrid />
        <CustomizeSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
