'use client';

import { motion } from 'framer-motion';
import { Heart, Users, Award, Zap } from 'lucide-react';

const AboutSection = () => {
  const values = [
    {
      icon: Heart,
      title: 'Passione per la qualità',
      description: 'Ogni sticker è realizzato con materiali premium e attenzione ai dettagli'
    },
    {
      icon: Users,
      title: 'Community creativa',
      description: 'Una piattaforma dove artisti e creativi condividono le loro idee'
    },
    {
      icon: Award,
      title: 'Eccellenza nel design',
      description: 'Design unici e innovativi che si distinguono dalla massa'
    },
    {
      icon: Zap,
      title: 'Innovazione continua',
      description: 'Sempre al passo con le ultime tendenze e tecnologie'
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
            La nostra{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              filosofia
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stem nasce dalla convinzione che ogni idea meriti di essere trasformata in qualcosa di tangibile e bello
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
              La nostra storia
            </h3>
            <div className="space-y-4 text-gray-600">
              <p>
                Fondata nel 2023, Stem è nata dall&apos;idea di democratizzare la creatività. 
                Volevamo creare una piattaforma dove chiunque potesse trasformare le proprie 
                idee in sticker e oggetti personalizzati di alta qualità.
              </p>
              <p>
                Oggi, migliaia di creativi, artisti e aziende si affidano a noi per 
                materializzare le loro visioni. Ogni progetto che realizziamo è una 
                testimonianza del potere della creatività umana.
              </p>
              <p>
                La nostra missione è semplice: rendere la personalizzazione accessibile, 
                divertente e di qualità premium per tutti.
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
            I nostri valori
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
              <div className="text-purple-100">Design creati</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">5K+</div>
              <div className="text-purple-100">Clienti soddisfatti</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-purple-100">Paesi serviti</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99%</div>
              <div className="text-purple-100">Soddisfazione clienti</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
