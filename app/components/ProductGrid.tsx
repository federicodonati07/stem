'use client';

import { motion, cubicBezier } from 'framer-motion';
import { Button, Card, CardBody, CardFooter } from '@heroui/react';
import { ShoppingCart, Heart, Star } from 'lucide-react';

const ProductGrid = () => {
  const products = [
    {
      id: 1,
      name: 'Sticker Pack Vintage',
      price: '€12.99',
      image: '🎨',
      rating: 4.8,
      reviews: 124,
      badge: 'Popolare'
    },
    {
      id: 2,
      name: 'Sticker Minimalist',
      price: '€9.99',
      image: '✨',
      rating: 4.9,
      reviews: 89,
      badge: 'Nuovo'
    },
    {
      id: 3,
      name: 'Sticker Neon',
      price: '€15.99',
      image: '💫',
      rating: 4.7,
      reviews: 156,
      badge: null
    },
    {
      id: 4,
      name: 'Sticker Nature',
      price: '€11.99',
      image: '🌿',
      rating: 4.6,
      reviews: 98,
      badge: null
    },
    {
      id: 5,
      name: 'Sticker Abstract',
      price: '€13.99',
      image: '🎭',
      rating: 4.8,
      reviews: 112,
      badge: 'Trending'
    },
    {
      id: 6,
      name: 'Sticker Geometric',
      price: '€10.99',
      image: '🔷',
      rating: 4.5,
      reviews: 76,
      badge: null
    },
    {
      id: 7,
      name: 'Sticker Kawaii',
      price: '€14.99',
      image: '🌸',
      rating: 4.9,
      reviews: 203,
      badge: 'Best Seller'
    },
    {
      id: 8,
      name: 'Sticker Space',
      price: '€16.99',
      image: '🚀',
      rating: 4.7,
      reviews: 87,
      badge: null
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: cubicBezier(0.42, 0, 0.58, 1)
      }
    }
  };

  return (
    <section id="shop" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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
            Scopri la nostra collezione di sticker premium, progettati per durare e stupire
          </p>
        </motion.div>

        {/* Products Grid */}
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
              transition={{ duration: 0.3, ease: cubicBezier(0.42, 0, 0.58, 1) }}
            >
              <Card className="h-full group cursor-pointer border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 rounded-2xl">
                <CardBody className="p-4 rounded-2xl">
                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.badge === 'Popolare' ? 'bg-red-100 text-red-700' :
                        product.badge === 'Nuovo' ? 'bg-green-100 text-green-700' :
                        product.badge === 'Trending' ? 'bg-purple-100 text-purple-700' :
                        product.badge === 'Best Seller' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {product.badge}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                  >
                    <Heart size={16} />
                  </Button>

                  {/* Product Image */}
                  <div className="flex items-center justify-center h-32 w-32 mx-auto mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl group-hover:from-purple-50 group-hover:to-blue-50 transition-all duration-300 shadow-md">
                    <span className="text-5xl select-none">
                      {product.image}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={`${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    <div className="text-lg font-bold text-gray-900">
                      {product.price}
                    </div>
                  </div>
                </CardBody>

                <CardFooter className="pt-0 px-4 pb-4 rounded-2xl">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full"
                    startContent={<ShoppingCart size={16} />}
                  >
                    Aggiungi al carrello
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            variant="bordered"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold px-8 py-6 rounded-full"
          >
            Vedi tutti i prodotti
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductGrid;
