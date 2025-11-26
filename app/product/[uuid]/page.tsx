"use client";

import React from "react";
/* eslint-disable @next/next/no-img-element */
import { useParams, useRouter } from "next/navigation";
import { supabase, PRODUCTS_DB, PRODUCTS_STORAGE } from "../../components/auth/supabaseClient";
import { useAccount } from "../../components/AccountContext";
import { useCart } from "../../components/CartContext";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams<{ uuid: string }>();
  const router = useRouter();
  const { user } = useAccount();
  const { addToCart } = useCart();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  type ProductDoc = { id?: string; uuid: string; name?: string; description?: string; price?: string | number; colors?: any[]; sizes?: any[]; personalizable?: boolean; category?: string };
  const [product, setProduct] = React.useState<ProductDoc | null>(null);
  const [color, setColor] = React.useState<string | undefined>(undefined);
  const [size, setSize] = React.useState<string | undefined>(undefined);
  const [personalizeMode, setPersonalizeMode] = React.useState<"none" | "text" | "image">("none");
  const [personalizeText, setPersonalizeText] = React.useState("");
  const [personalizeFile, setPersonalizeFile] = React.useState<File | null>(null);
  const [personalizePreview, setPersonalizePreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function makePersonalizedId(prodUuid: string, userId: string) {
    function shortHash(input: string, len = 8) {
      let h = 5381;
      for (let i = 0; i < input.length; i++) h = ((h << 5) + h) + input.charCodeAt(i);
      const base = Math.abs(h).toString(36);
      return base.slice(0, len);
    }
    const hp = shortHash(prodUuid, 8);
    const hu = shortHash(userId, 8);
    const s5 = Math.floor(Date.now() % 60466176).toString(36).padStart(5, '0');
    return `personalized_${hp}_${hu}_${s5}`;
  }

  React.useEffect(() => {
    (async () => {
      if (!params?.uuid) { 
        setError("UUID prodotto mancante"); 
        setLoading(false); 
        return; 
      }
      
      try {
        const { data, error: fetchError } = await supabase
          .from(PRODUCTS_DB)
          .select('*')
          .eq('uuid', params.uuid)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Error fetching product:', fetchError);
          setError("Errore nel caricamento del prodotto");
          setLoading(false);
          return;
        }
        
        if (!data) { 
          setError("Prodotto non trovato"); 
          setLoading(false); 
          return; 
        }
        
        const mapped: ProductDoc = {
          id: data.id?.toString(),
          uuid: String(data.uuid || params.uuid),
          name: typeof data.name === 'string' ? data.name : undefined,
          description: typeof data.description === 'string' ? data.description : undefined,
          price: (typeof data.price === 'string' || typeof data.price === 'number') ? data.price : undefined,
          colors: Array.isArray(data.colors) ? data.colors : [],
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          personalizable: Boolean(data.personalizable),
          category: typeof data.category === 'string' ? data.category : undefined,
        };
        
        setProduct(mapped);
        const colors: string[] = Array.isArray(mapped.colors) ? mapped.colors.map((c) => String(c)) : [];
        const sizes: string[] = Array.isArray(mapped.sizes) ? mapped.sizes.map((s) => String(s)) : [];
        setColor(colors[0]);
        setSize(sizes[0]);
        
        const isPersonalizable = !!mapped.personalizable && (mapped.category === 'Stickers' || mapped.category === 'Plate');
        if (isPersonalizable) {
          setPersonalizeMode(mapped.category === 'Stickers' ? 'text' : 'text');
        } else {
          setPersonalizeMode('none');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError("Errore nel caricamento del prodotto");
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.uuid]);

  async function handleAddToCart() {
    if (!product) return;
    setFormError(null);
    let personalized: string | undefined = undefined;
    const canPersonalize = !!product.personalizable && (product.category === 'Stickers' || product.category === 'Plate');
    
    if (canPersonalize) {
      if (product.category === 'Stickers' && personalizeMode === 'none') {
        setFormError('Per la categoria Stickers la personalizzazione è obbligatoria.');
        return;
      }
      
      if (personalizeMode === "text") {
        if (!personalizeText.trim()) {
          setFormError('Inserisci un testo per la personalizzazione.');
          return;
        }
        personalized = personalizeText.trim();
      } else if (personalizeMode === "image") {
        if (!personalizeFile) {
          setFormError('Seleziona un\'immagine da caricare.');
          return;
        }
        if (!user) {
          setFormError('Impossibile caricare immagine: devi effettuare il login.');
          return;
        }
        
        const allowed = ["image/png", "image/svg+xml"];
        if (!allowed.includes(personalizeFile.type)) {
          setFormError('Formato non supportato. Carica un file PNG o SVG.');
          return;
        }
        
        try {
          setUploading(true);
          const fileId = makePersonalizedId(product.uuid, user.$id);
          
          // Try to delete existing file (ignore errors if it doesn't exist)
          try { 
            await supabase.storage.from(PRODUCTS_STORAGE).remove([fileId]); 
          } catch {}
          
          // Upload new file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(PRODUCTS_STORAGE)
            .upload(fileId, personalizeFile, {
              upsert: false,
            });
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            setFormError('Errore nel caricamento dell\'immagine, riprova.');
            setUploading(false);
            return;
          }
          
          personalized = `/api/media/products/${fileId}`;
        } catch (e) {
          console.error('personalized image upload error', e);
          setFormError('Errore nel caricamento dell\'immagine, riprova.');
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
    }
    
    await addToCart(product.uuid, 1, personalized, color, size);
    router.push("/cart");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Caricamento...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!product) return null;

  const colors: string[] = Array.isArray(product.colors) ? product.colors.map((c) => String(c)) : [];
  const sizes: string[] = Array.isArray(product.sizes) ? product.sizes.map((s) => String(s)) : [];
  const canPersonalize = !!product.personalizable && (product.category === 'Stickers' || product.category === 'Plate');
  const forcePersonalization = product.category === 'Stickers' && !!product.personalizable;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="bordered" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50" startContent={<ArrowLeft size={16} />} onClick={() => router.back()}>
            Indietro
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <img src={`/api/media/products/${product.uuid}`} alt={product.name} className="w-full h-96 object-cover rounded-xl" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; (e.currentTarget as HTMLImageElement).className = 'w-40 h-40 object-contain'; }} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-700 mb-4 leading-relaxed">{product.description}</p>
            <div className="text-lg font-bold text-gray-900 flex items-baseline gap-1 mb-6"><span>€</span><span>{product.price}</span><span className="text-xs text-gray-500">/EUR</span></div>

            {colors.length > 0 ? (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-800 mb-2">Colore</div>
                <div className="flex items-center gap-3 flex-wrap">
                  {colors.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-colors ${color === c ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-300 hover:border-purple-400'}`} style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
            ) : null}

            {sizes.length > 0 ? (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-800 mb-2">Taglia</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {sizes.map((s) => (
                    <button 
                      key={s} 
                      type="button" 
                      onClick={() => setSize(s)} 
                      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                        size === s 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {canPersonalize ? (
              <div className="mb-8">
                <div className="text-sm font-semibold text-gray-800 mb-2">Personalizzazione</div>
                <div className="flex items-center gap-3 mb-4">
                  <button type="button" onClick={() => setPersonalizeMode('text')} className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${personalizeMode === 'text' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'border border-gray-300 text-gray-800 hover:border-purple-400'}`}>
                    Testo
                  </button>
                  <button type="button" onClick={() => setPersonalizeMode('image')} className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${personalizeMode === 'image' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'border border-gray-300 text-gray-800 hover:border-purple-400'}`}>
                    Immagine
                  </button>
                  {!forcePersonalization && (
                    <button type="button" onClick={() => setPersonalizeMode('none')} className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${personalizeMode === 'none' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'border border-gray-300 text-gray-800 hover:border-purple-400'}`}>
                      Nessuna
                    </button>
                  )}
                </div>
                {personalizeMode === 'text' ? (
                  <input
                    type="text"
                    maxLength={50}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                    placeholder="Inserisci il testo (max 50)"
                    value={personalizeText}
                    onChange={(e) => setPersonalizeText(e.target.value.slice(0,25))}
                  />
                ) : null}
                {personalizeMode === 'image' ? (
                  <div className="space-y-3">
                    <input type="file" accept=",.png,.svg,image/png,image/svg+xml" className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900" onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f && !["image/png", "image/svg+xml"].includes(f.type)) {
                        setFormError('Formato non supportato. Carica un file PNG o SVG.');
                        setPersonalizeFile(null);
                        setPersonalizePreview(null);
                        return;
                      }
                      setFormError(null);
                      setPersonalizeFile(f);
                      setPersonalizePreview(f ? URL.createObjectURL(f) : null);
                    }} />
                    {personalizePreview ? (
                      <div className="flex items-center gap-3">
                        <img src={personalizePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
                        <Button variant="bordered" className="rounded-full border-red-300 text-red-700" onClick={() => { setPersonalizeFile(null); setPersonalizePreview(null); }}>Rimuovi immagine</Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button className="h-12 px-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" onClick={handleAddToCart} isDisabled={uploading}>
                {uploading ? 'Caricamento...' : 'Aggiungi al carrello'}
              </Button>
              <Button variant="bordered" className="h-12 px-6 rounded-full" onClick={() => router.push('/#shop')}>Torna allo shop</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
