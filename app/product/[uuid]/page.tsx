"use client";

import React from "react";
/* eslint-disable @next/next/no-img-element */
import { useParams, useRouter } from "next/navigation";
import { supabase, PRODUCTS_DB, PRODUCTS_STORAGE, CLIENT_CUSTOMIZATION_STORAGE, USER_COLLECTION } from "../../components/auth/supabaseClient";
import { useAccount } from "../../components/AccountContext";
import { useCart } from "../../components/CartContext";
import { Button } from "@heroui/react";
import { ArrowLeft, Heart } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams<{ uuid: string }>();
  const router = useRouter();
  const { user } = useAccount();
  const { addToCart } = useCart();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  type ProductDoc = { id?: string; uuid: string; name?: string; description?: string; price?: string | number; colors?: any[]; sizes?: any[]; personalizable?: boolean; category?: string; likes?: number };
  const [product, setProduct] = React.useState<ProductDoc | null>(null);
  const [liking, setLiking] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
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
          likes: Number(data.likes ?? 0),
        };
        
        setProduct(mapped);
        const colors: string[] = Array.isArray(mapped.colors) ? mapped.colors.map((c) => String(c)) : [];
        const sizes: string[] = Array.isArray(mapped.sizes) ? mapped.sizes.map((s) => String(s)) : [];
        setColor(colors[0]);
        setSize(sizes[0]);
        
        // Set personalize mode based on category
        const isPersonalizable = !!mapped.personalizable;
        if (isPersonalizable) {
          if (mapped.category === 'CustomImage') {
            setPersonalizeMode('image');
          } else if (mapped.category === 'CustomText') {
            setPersonalizeMode('text');
          } else {
            setPersonalizeMode('none');
          }
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

  // Detect if current user has liked this product
  React.useEffect(() => {
    (async () => {
      if (!user || !product?.uuid) {
        setLiked(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from(USER_COLLECTION)
          .select('liked_products')
          .eq('uuid', user.$id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching liked_products for user:', error);
          return;
        }

        const arr: string[] = Array.isArray((data as any)?.liked_products)
          ? (data as any).liked_products.map((v: unknown) => String(v))
          : [];

        setLiked(arr.includes(product.uuid));
      } catch (err) {
        console.error('Unexpected error fetching liked_products:', err);
      }
    })();
  }, [user?.$id, product?.uuid]);

  async function handleLike() {
    if (!user || !product || liking) return;

    setLiking(true);
    try {
      // Fetch current liked_products for user
      const { data, error } = await supabase
        .from(USER_COLLECTION)
        .select('liked_products')
        .eq('uuid', user.$id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching liked_products for toggle:', error);
        return;
      }

      const currentArr: string[] = Array.isArray((data as any)?.liked_products)
        ? (data as any).liked_products.map((v: unknown) => String(v))
        : [];

      const isCurrentlyLiked = currentArr.includes(product.uuid);
      const updatedArr = isCurrentlyLiked
        ? currentArr.filter((id) => id !== product.uuid)
        : [...currentArr, product.uuid];

      const delta = isCurrentlyLiked ? -1 : 1;
      const newLikes = Math.max(0, (product.likes ?? 0) + delta);

      // Update user_info.liked_products
      const { error: userError } = await supabase
        .from(USER_COLLECTION)
        .update({ liked_products: updatedArr })
        .eq('uuid', user.$id);

      if (userError) {
        console.error('Error updating liked_products on user_info:', userError);
        return;
      }

      // Update product likes
      const { error: updateError } = await supabase
        .from(PRODUCTS_DB)
        .update({ likes: newLikes })
        .eq('uuid', product.uuid);

      if (updateError) {
        console.error('Error updating likes:', updateError);
        return;
      }

      setProduct(prev => prev ? { ...prev, likes: newLikes } : prev);
      setLiked(!isCurrentlyLiked);
    } catch (err) {
      console.error('Error liking product:', err);
    } finally {
      setLiking(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return;
    setFormError(null);
    let personalized: string | undefined = undefined;
    
    const isCustomText = !!product.personalizable && product.category === 'CustomText';
    const isCustomImage = !!product.personalizable && product.category === 'CustomImage';
    
    // Handle CustomText personalization
    if (isCustomText) {
      if (!personalizeText.trim()) {
        setFormError('Inserisci un testo per la personalizzazione.');
        return;
      }
      personalized = personalizeText.trim();
    }
    
    // Handle CustomImage personalization
    if (isCustomImage) {
      if (!personalizeFile) {
        setFormError('Seleziona un\'immagine da caricare.');
        return;
      }
      if (!user) {
        setFormError('Impossibile caricare immagine: devi effettuare il login.');
        return;
      }
      
      const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
      if (!allowed.includes(personalizeFile.type)) {
        setFormError('Formato non supportato. Carica un file PNG, JPG o SVG.');
        return;
      }
      
      // Check file size (max 10MB)
      if (personalizeFile.size > 10 * 1024 * 1024) {
        setFormError('Il file è troppo grande. Massimo 10MB.');
        return;
      }
      
      try {
        setUploading(true);
        // Create unique filename: {userId}_{productUuid}_{timestamp}.ext
        const timestamp = Date.now();
        const ext = personalizeFile.type.split('/')[1];
        const fileId = `${user.$id}_${product.uuid}_${timestamp}.${ext}`;
        
        // Try to delete old files for this user/product combination (ignore errors)
        try { 
          const { data: existingFiles } = await supabase.storage
            .from(CLIENT_CUSTOMIZATION_STORAGE)
            .list('', {
              search: `${user.$id}_${product.uuid}_`
            });
          
          if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles.map(f => f.name);
            await supabase.storage.from(CLIENT_CUSTOMIZATION_STORAGE).remove(filesToDelete);
          }
        } catch {}
        
        // Upload new file
        const { error: uploadError } = await supabase.storage
          .from(CLIENT_CUSTOMIZATION_STORAGE)
          .upload(fileId, personalizeFile, {
            upsert: false,
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          setFormError('Errore nel caricamento dell\'immagine, riprova.');
          setUploading(false);
          return;
        }
        
        // Return the storage path (will be saved in cart)
        personalized = `client_customization/${fileId}`;
      } catch (e) {
        console.error('Personalized image upload error', e);
        setFormError('Errore nel caricamento dell\'immagine, riprova.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
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
  const isCustomText = !!product.personalizable && product.category === 'CustomText';
  const isCustomImage = !!product.personalizable && product.category === 'CustomImage';
  const canPersonalize = isCustomText || isCustomImage;

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
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-700 mb-4 leading-relaxed">{product.description}</p>
              </div>
              
              {/* Like Button */}
              <div className="ml-4">
                {user ? (
                  <Button
                    isIconOnly
                    size="lg"
                    className="bg-white hover:bg-red-50 shadow-xl rounded-full min-w-[64px] h-[64px] border-2 border-red-100"
                    onClick={handleLike}
                    isDisabled={liking}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Heart 
                        size={28} 
                        className={`${liked ? 'text-red-500 fill-current' : 'text-red-500 hover:fill-current'} transition-all`}
                      />
                      <span className="text-sm font-bold text-gray-900">{product.likes ?? 0}</span>
                    </div>
                  </Button>
                ) : (
                  <div className="bg-white shadow-xl rounded-full px-5 py-3 flex items-center gap-2.5 border-2 border-red-100">
                    <Heart size={24} className="text-red-500 fill-current" />
                    <span className="text-lg font-bold text-gray-900">{product.likes ?? 0}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-2xl font-bold flex items-baseline gap-1 mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">€{product.price}</span>
              <span className="text-sm text-gray-500 font-medium">EUR</span>
            </div>

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
              <div className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">✨</span>
                  <div className="text-base font-bold text-gray-900">
                    Personalizzazione {isCustomText ? 'Testo' : 'Immagine'}
                  </div>
                </div>
                
                {isCustomText ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Inserisci il tuo testo personalizzato</label>
                    <input
                      type="text"
                      maxLength={30}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-500 font-medium"
                      placeholder="Es. Il tuo nome, frase..."
                      value={personalizeText}
                      onChange={(e) => setPersonalizeText(e.target.value.slice(0, 30))}
                    />
                    <p className="text-xs text-gray-500">{personalizeText.length}/30 caratteri</p>
                  </div>
                ) : null}
                
                {isCustomImage ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Carica la tua immagine personalizzata</label>
                    <input 
                      type="file" 
                      accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/jpg,image/svg+xml" 
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-900 text-sm bg-white hover:bg-gray-50 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f && !["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(f.type)) {
                          setFormError('Formato non supportato. Carica un file PNG, JPG o SVG.');
                          setPersonalizeFile(null);
                          setPersonalizePreview(null);
                          return;
                        }
                        if (f && f.size > 10 * 1024 * 1024) {
                          setFormError('Il file è troppo grande. Massimo 10MB.');
                          setPersonalizeFile(null);
                          setPersonalizePreview(null);
                          return;
                        }
                        setFormError(null);
                        setPersonalizeFile(f);
                        setPersonalizePreview(f ? URL.createObjectURL(f) : null);
                      }} 
                    />
                    <p className="text-xs text-gray-500">✅ Formati: PNG, JPG, SVG | 📏 Massimo: 10MB</p>
                    
                    {personalizePreview ? (
                      <div className="bg-white rounded-xl p-3 border-2 border-purple-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Anteprima</p>
                        <div className="flex items-center gap-3">
                          <img src={personalizePreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-2">{personalizeFile?.name}</p>
                            <Button 
                              variant="bordered" 
                              size="sm"
                              className="rounded-full border-red-300 text-red-700 hover:bg-red-50" 
                              onClick={() => { 
                                setPersonalizeFile(null); 
                                setPersonalizePreview(null); 
                              }}
                            >
                              🗑️ Rimuovi
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                
                {formError ? (
                  <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">⚠️ {formError}</p>
                  </div>
                ) : null}
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
