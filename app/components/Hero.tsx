'use client';

import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { ArrowRight, Sparkles, ArrowDown } from 'lucide-react';

const Hero = () => {
  const scrollToShop = () => {
    const el = document.getElementById('shop');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 text-white"
    >
      {/* Modern background with soft lights */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft light blobs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-400/35 blur-3xl rounded-full" />
        <div className="absolute top-10 -right-32 w-96 h-96 bg-blue-400/30 blur-3xl rounded-full" />
        <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 w-[620px] h-[620px] bg-gradient-to-t from-slate-900 via-slate-800 to-transparent opacity-90" />
        {/* Subtle radial highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10)_0,_transparent_60%)]" />
        {/* Very light grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-white/10 text-purple-100 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15 backdrop-blur-sm"
            >
              <Sparkles size={16} />
              <span>Esperienza d&apos;acquisto chiara e affidabile</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            >
              Un unico posto per
              <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                prodotti pronti da scegliere, subito
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl text-slate-200/90 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Navigazione semplice, informazioni chiare e prodotti selezionati. 
              Dalla scoperta all&apos;ordine, ogni step è pensato per essere immediato e comprensibile.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl"
                endContent={<ArrowRight size={20} />}
                onClick={scrollToShop}
              >
                Vai allo shop
              </Button>
              <button
                type="button"
                onClick={scrollToShop}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                Scorri per vedere i prodotti
                <ArrowDown size={18} />
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-slate-300">Ordini gestiti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">5K+</div>
                <div className="text-sm text-slate-300">Clienti soddisfatti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4.8/5</div>
                <div className="text-sm text-slate-300">Valutazione media</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full h-96 lg:h-[500px]">
              {/* Layered modern cards as abstract representation of products */}
              <motion.div
                className="absolute top-8 left-6 right-8 h-40 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="h-full w-full p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Panoramica
                      </p>
                      <p className="text-sm text-slate-100">
                        Prodotti pronti all&apos;acquisto, sempre aggiornati.
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold">
                      Online
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs text-slate-200">
                    <div>
                      <p className="font-semibold">Categorie</p>
                      <p className="text-slate-400">Varie, organizzate per uso</p>
                    </div>
                    <div>
                      <p className="font-semibold">Info chiare</p>
                      <p className="text-slate-400">Prezzo, disponibilità, varianti</p>
                    </div>
                    <div>
                      <p className="font-semibold">Percorso rapido</p>
                      <p className="text-slate-400">Dalla card al checkout in pochi step</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-10 left-4 right-16 h-40 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="h-full w-full p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Esperienza utente
                    </p>
                    <span className="text-xs text-slate-300">Step chiari</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-100">Scelta prodotto</p>
                      <p className="text-slate-400">Informazioni leggibili subito</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-100">Carrello</p>
                      <p className="text-slate-400">Riepilogo chiaro e modificabile</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-100">Ordine</p>
                      <p className="text-slate-400">Tracking e stato sempre visibili</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Accent floating elements */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 right-8 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-xl flex items-center justify-center"
              >
                <span className="text-white text-xl">⭐</span>
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0], rotate: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-2xl shadow-xl flex items-center justify-center"
              >
                <span className="text-white text-2xl">🛒</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
