'use client';

import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { Palette, Upload, Wand2, Download } from 'lucide-react';

const CustomizeSection = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Carica il tuo design',
      description: 'Scegli un\'immagine o inizia da zero con i nostri template'
    },
    {
      icon: Palette,
      title: 'Personalizza',
      description: 'Modifica colori, dimensioni e aggiungi effetti unici'
    },
    {
      icon: Wand2,
      title: 'Anteprima',
      description: 'Visualizza il risultato finale prima dell\'ordine'
    },
    {
      icon: Download,
      title: 'Ordina',
      description: 'Conferma e ricevi i tuoi sticker personalizzati'
    }
  ];

  return (
    <section id="customize" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Palette size={16} />
              <span>Personalizzazione facile</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6"
            >
              Personalizza i tuoi{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                sticker
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 mb-8"
            >
              Trasforma le tue idee in sticker unici con il nostro editor intuitivo. 
              Nessuna competenza tecnica richiesta, solo creatività.
            </motion.p>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-6 mb-8"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <step.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-6 rounded-full"
                startContent={<Palette size={20} />}
              >
                Inizia a personalizzare
              </Button>
              <Button
                size="lg"
                variant="bordered"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold px-8 py-6 rounded-full"
              >
                Vedi esempi
              </Button>
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Design Canvas */}
            <div className="relative w-full h-96 bg-white rounded-2xl shadow-2xl p-8">
              {/* Design Preview */}
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                {/* Sample Design */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-6xl"
                >
                  🎨
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-purple-400 rounded-full"
                />
                <motion.div
                  animate={{ 
                    y: [0, 10, 0],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute bottom-4 left-4 w-6 h-6 bg-blue-400 rounded-full"
                />
              </div>

              {/* Tools Panel */}
              <div className="absolute -bottom-4 -right-4 w-32 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <Palette size={12} className="text-purple-600" />
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Wand2 size={12} className="text-blue-600" />
                </div>
                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                  <Download size={12} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Floating Stickers */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl shadow-lg flex items-center justify-center"
            >
              <span className="text-white text-xl">✨</span>
            </motion.div>

            <motion.div
              animate={{ 
                y: [0, 15, 0],
                rotate: [0, -8, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute -bottom-8 -left-12 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg flex items-center justify-center"
            >
              <span className="text-white text-2xl">🌟</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CustomizeSection;
