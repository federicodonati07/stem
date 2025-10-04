'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    shop: [
      { name: 'Tutti i prodotti', href: '#shop' },
      { name: 'Sticker personalizzati', href: '#customize' },
      { name: 'Categorie', href: '#' },
      { name: 'Offerte speciali', href: '#' }
    ]
  };

  // social links rimossi

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className=""
            >
              {/* Logo */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold">Stem</span>
              </div>

              <p className="text-gray-300 mb-6 max-w-md">
                Trasforma le tue idee in sticker e oggetti personalizzati unici. 
                Qualità premium, design innovativo, consegna veloce.
              </p>

              <p className="text-gray-300 font-medium">
                Grazie per essere qui. Un caro saluto dal team Stem.
              </p>
            </motion.div>

            {/* Shop Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-lg mb-4">Shop</h3>
              <ul className="space-y-3">
                {footerLinks.shop.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 py-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-300 mb-4 md:mb-0">
              <span>© 2024 Stem. Tutti i diritti riservati.</span>
              <Heart size={16} className="text-red-500" />
            </div>

            {/* Legal Links */}
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              <a href="/privacy" className="hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors duration-200">
                Termini di servizio
              </a>
              <a href="#" className="hover:text-white transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
