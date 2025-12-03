"use client";
/* eslint-disable @next/next/no-img-element */

import { motion, type Variants } from 'framer-motion';
import { Button, Card, CardBody, CardFooter } from '@heroui/react';
import { Heart, Package, ArrowRight } from 'lucide-react';
import React from 'react';
import { supabase, PRODUCTS_DB, USER_COLLECTION } from './auth/supabaseClient';
import Link from 'next/link';
import { useAccount } from './AccountContext';

type Product = {
  id: string;
  name: string;
  price: string;
  uuid: string;
  img_url?: string;
  personalizable?: boolean;
  description?: string;
  stock?: number;
  colors?: string[];
  sizes?: string[];
  likes?: number;
};

const ProductGrid = () => {
  const { user } = useAccount();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [likingProducts, setLikingProducts] = React.useState<Set<string>>(new Set());
  const [likedProductIds, setLikedProductIds] = React.useState<Set<string>>(new Set());
  const [chunksToShow, setChunksToShow] = React.useState(1); // quanti blocchi da 3 prodotti mostrare

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from(PRODUCTS_DB)
        .select('*')
        .eq('status', true)
        .limit(100);
      
      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        setError('Impossibile caricare i prodotti');
        return;
      }
      
      const mapped: Product[] = (data || []).map((d: { [key: string]: unknown }) => ({
        id: String(d.id ?? ''),
        name: String(d.name ?? ''),
        price: String(d.price ?? ''),
        uuid: String(d.uuid ?? ''),
        img_url: typeof d.img_url === 'string' ? d.img_url.split('?')[0] : undefined,
        personalizable: Boolean(d.personalizable),
        description: typeof d.description === 'string' ? d.description : '',
        stock: Number(d.stock ?? 0),
        colors: Array.isArray(d.colors) ? d.colors.map((c: unknown) => String(c)) : [],
        sizes: Array.isArray(d.sizes) ? d.sizes.map((s: unknown) => String(s)) : [],
        likes: Number(d.likes ?? 0),
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Impossibile caricare i prodotti');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch liked products for authenticated user
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setLikedProductIds(new Set());
        return;
      }
      try {
        const { data, error } = await supabase
          .from(USER_COLLECTION)
          .select('liked_products')
          .eq('uuid', user.$id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching liked products:', error);
          return;
        }

        const raw = data as { [key: string]: unknown } | null;
        const liked = raw && Array.isArray(raw.liked_products)
          ? raw.liked_products.map((v: unknown) => String(v))
          : [];

        if (!cancelled) {
          setLikedProductIds(new Set(liked));
        }
      } catch (err) {
        console.error('Unexpected error fetching liked products:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLike = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || likingProducts.has(product.uuid)) return;

    setLikingProducts(prev => new Set(prev).add(product.uuid));

    try {
      // Determine current like state for this user
      const currentlyLiked = likedProductIds.has(product.uuid);

      // Build new liked products array on user_info.liked_products
      const updatedLikedSet = new Set(likedProductIds);
      if (currentlyLiked) {
        updatedLikedSet.delete(product.uuid);
      } else {
        updatedLikedSet.add(product.uuid);
      }
      const likedArray = Array.from(updatedLikedSet);

      // Compute new likes count (never below 0)
      const delta = currentlyLiked ? -1 : 1;
      const newLikes = Math.max(0, (product.likes ?? 0) + delta);

      // Update user_info.liked_products
      const { error: userError } = await supabase
        .from(USER_COLLECTION)
        .update({ liked_products: likedArray })
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

      // Update local state
      setProducts(prev =>
        prev.map(p =>
          p.uuid === product.uuid ? { ...p, likes: newLikes } : p
        )
      );
      setLikedProductIds(updatedLikedSet);
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLikingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.uuid);
        return newSet;
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.42, 0, 1, 1]
      }
    }
  };

  const totalChunks = Math.ceil(products.length / 3) || 1;
  const safeChunks = Math.min(chunksToShow, totalChunks);
  const visibleProducts = products.slice(0, safeChunks * 3);

  return (
    <section id="shop" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 uppercase tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vai allo shop
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Prodotti pronti da scegliere
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Una selezione organizzata e leggibile: nome, descrizione, varianti, disponibilità e prezzo
            in un colpo d&apos;occhio.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-slate-300">Caricamento prodotti...</div>
        ) : error ? (
          <div className="text-center text-red-400 font-medium">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-slate-300">Nessun prodotto disponibile al momento.</div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 justify-items-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visibleProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                onClick={() => { window.location.href = `/product/${product.uuid}`; }}
                className="cursor-pointer w-full max-w-[320px]"
              >
                <Card className="h-full flex flex-col group cursor-pointer border border-gray-200 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
                  <CardBody className="p-0">
                    {/* Image Container with Like Button */}
                    <div className="relative h-56 w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      <img
                        src={`/api/media/products/${product.uuid}`}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).onerror = null;
                          (e.currentTarget as HTMLImageElement).src = '/window.svg';
                          (e.currentTarget as HTMLImageElement).className = 'h-24 w-24 object-contain absolute inset-0 m-auto';
                        }}
                      />
                      
                      {/* Like Button/Counter */}
                      <div className="absolute top-3 right-3">
                        {user ? (
                          <Button
                            isIconOnly
                            size="lg"
                            className="bg-white hover:bg-red-50 shadow-xl rounded-full min-w-[56px] h-[56px] border-2 border-red-100"
                            onClick={(e) => handleLike(product, e)}
                            isDisabled={likingProducts.has(product.uuid)}
                          >
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <Heart 
                                size={24} 
                                className={`${likedProductIds.has(product.uuid) ? 'text-red-500 fill-current' : 'text-red-500 hover:fill-current'} transition-all`}
                              />
                              <span className="text-xs font-bold text-gray-900">{product.likes ?? 0}</span>
                            </div>
                          </Button>
                        ) : (
                          <div className="bg-white shadow-xl rounded-full px-4 py-2.5 flex items-center gap-2 border-2 border-red-100">
                            <Heart size={20} className="text-red-500 fill-current" />
                            <span className="text-base font-bold text-gray-900">{product.likes ?? 0}</span>
                          </div>
                        )}
                      </div>

                      {/* Stock Badge */}
                      {(product.stock ?? 0) < 10 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          Solo {product.stock} rimasti!
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors duration-200 line-clamp-2">
                          {product.name}
                        </h3>
                        {/* Description */}
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Colors */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Colori disponibili</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {product.colors.slice(0, 8).map((c, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                            {product.colors.length > 8 && (
                              <span className="text-xs font-semibold text-gray-500 ml-1">+{product.colors.length - 8}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sizes */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Taglie disponibili</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {product.sizes.slice(0, 6).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors"
                              >
                                {s}
                              </span>
                            ))}
                            {product.sizes.length > 6 && (
                              <span className="text-xs font-semibold text-gray-500">+{product.sizes.length - 6}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-gray-200 pt-3 space-y-2 mt-auto">
                        {/* Stock */}
                        <div className="flex items-center gap-2 text-sm">
                          <Package size={16} className="text-gray-500" />
                          <span className="text-gray-600">
                            Disponibilità: <span className={`font-bold ${((product.stock ?? 0) < 10) ? 'text-red-600' : 'text-green-600'}`}>
                              {(product.stock ?? 0) > 0 ? `${product.stock} pz` : 'Esaurito'}
                            </span>
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            €{product.price}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">EUR</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter className="pt-0 px-4 pb-4">
                    <Link href={`/product/${product.uuid}`} className="w-full" onClick={(e) => e.stopPropagation()}>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-11">
                        Visualizza dettagli
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
              ))}
            </motion.div>

            {/* Mostra più prodotti */}
            {visibleProducts.length < products.length && (
              <div className="mt-10 flex justify-center">
                <Button
                  size="md"
                  className="bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15 rounded-full px-6 py-3 text-sm font-semibold flex items-center gap-2"
                  onClick={() => setChunksToShow((prev) => prev + 1)}
                >
                  Mostra altri prodotti
                  <ArrowRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
