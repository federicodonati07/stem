"use client";
/* eslint-disable @next/next/no-img-element */

import { motion, type Variants } from 'framer-motion';
import { Button, Card, CardBody, CardFooter } from '@heroui/react';
import { Star } from 'lucide-react';
import React from 'react';
import { supabase, PRODUCTS_DB } from './auth/supabaseClient';
import Link from 'next/link';

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
};

const ProductGrid = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
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
        
        const mapped: Product[] = (data || []).map((d: any) => ({
          id: String(d.id ?? ''),
          name: String(d.name ?? ''),
          price: String(d.price ?? ''),
          uuid: String(d.uuid ?? ''),
          img_url: typeof d.img_url === 'string' ? d.img_url.split('?')[0] : undefined,
          personalizable: Boolean(d.personalizable),
          description: typeof d.description === 'string' ? d.description : '',
          stock: Number(d.stock ?? 0),
          colors: Array.isArray(d.colors) ? d.colors.map((c: any) => String(c)) : [],
        }));
        setProducts(mapped);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Impossibile caricare i prodotti');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  return (
    <section id="shop" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            I nostri{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              prodotti
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scopri la nostra collezione di prodotti disponibili
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-600">Caricamento prodotti...</div>
        ) : error ? (
          <div className="text-center text-red-600 font-medium">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-600">Nessun prodotto disponibile al momento.</div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                onClick={() => { window.location.href = `/product/${product.uuid}`; }}
                className="cursor-pointer"
              >
                <Card className="h-full group cursor-pointer border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardBody className="p-4 rounded-2xl">
                    <div className="flex items-center justify-center h-40 w-full mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
                      {/* Product Image */}
                      <img
                        src={`/api/media/products/${product.uuid}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).onerror = null;
                          (e.currentTarget as HTMLImageElement).src = '/window.svg';
                          (e.currentTarget as HTMLImageElement).className = 'h-20 w-20 object-contain';
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description ? (
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      ) : null}
                      {product.colors && product.colors.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {product.colors.slice(0, 6).map((c, idx) => (
                            <span key={idx} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }} title={c} />
                          ))}
                          {product.colors.length > 6 ? (
                            <span className="text-xs text-gray-500">+{product.colors.length - 6}</span>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} className={i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span>4.5/5</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Disponibilità: <span className={`font-semibold ${((product.stock ?? 0) < 10) ? 'text-red-600' : 'text-gray-900'}`}>{product.stock ?? 0}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 flex items-baseline gap-1">
                        <span>€</span>
                        <span>{product.price}</span>
                        <span className="text-xs text-gray-500">/EUR</span>
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter className="pt-0 px-4 pb-4 rounded-2xl">
                    <Link href={`/product/${product.uuid}`} className="w-full" onClick={(e) => e.stopPropagation()}>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full">
                        Visualizza prodotto
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
