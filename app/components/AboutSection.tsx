'use client';

import { motion } from 'framer-motion';
import { Heart, Users, Award, Zap } from 'lucide-react';

const AboutSection = () => {
  const values = [
    {
      icon: Heart,
      title: 'Clienti al centro',
      description: 'Supporto rapido, ordini tracciabili e un team dedicato alla tua esperienza.'
    },
    {
      icon: Users,
      title: 'Affidabilità nel tempo',
      description: 'Una base solida di clienti che torna ad acquistare e consiglia il servizio.'
    },
    {
      icon: Award,
      title: 'Qualità costante',
      description: 'Selezione accurata dei prodotti e controlli qualità su ogni ordine.'
    },
    {
      icon: Zap,
      title: 'Processi semplici',
      description: 'Percorsi di acquisto chiari, pagamenti sicuri e aggiornamenti in tempo reale.'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Perché scegliere{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Stem
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una piattaforma pensata per rendere l&apos;acquisto semplice, chiaro e affidabile,
            con numeri e risultati concreti alle spalle.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Story */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Un approccio concreto e trasparente
            </h3>
            <div className="space-y-4 text-gray-600">
              <p>
                Ogni scelta di prodotto, interfaccia e servizio è pensata per ridurre attriti
                e incertezze durante il percorso di acquisto.
              </p>
              <p>
                Dalla pagina prodotto al carrello, fino al tracking dell&apos;ordine, 
                puntiamo a rendere ogni passaggio chiaro, prevedibile e facile da comprendere.
              </p>
              <p>
                L&apos;obiettivo è semplice: farti sentire sempre in controllo, con tutte 
                le informazioni utili a portata di mano.
              </p>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full h-80 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
              {/* Central Logo */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <span className="text-white font-bold text-4xl">S</span>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  x: [0, 10, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-8 left-8 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center"
              >
                <span className="text-2xl">🎨</span>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 15, 0],
                  x: [0, -8, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute top-16 right-12 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center"
              >
                <span className="text-xl">✨</span>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  x: [0, 12, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute bottom-12 left-12 w-14 h-14 bg-white rounded-lg shadow-lg flex items-center justify-center"
              >
                <span className="text-2xl">💎</span>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 20, 0],
                  x: [0, -10, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className="absolute bottom-8 right-8 w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center"
              >
                <span className="text-lg">🌟</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

          {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Cosa rende l&apos;esperienza chiara e affidabile
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow duration-300"
                >
                  <value.icon size={24} className="text-white" />
                </motion.div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {value.title}
                </h4>
                <p className="text-gray-600 text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10K+</div>
              <div className="text-purple-100">Ordini gestiti</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">5K+</div>
              <div className="text-purple-100">Clienti soddisfatti</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">48h</div>
              <div className="text-purple-100">Tempo medio di preparazione</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">4.8/5</div>
              <div className="text-purple-100">Valutazione media servizio</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
