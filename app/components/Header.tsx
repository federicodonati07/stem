'use client';

import React, { useState, useRef } from "react";
import { useAccount } from "./AccountContext";
import { ChevronDown, LogOut, List } from "lucide-react";
import { motion } from 'framer-motion';
import { Menu, X, ShoppingBag, User, Palette, Home, Info } from 'lucide-react';
import { Button } from '@heroui/react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { databases, Query } from "./auth/appwriteClient";
import { usePathname, useRouter } from "next/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarMenu, setAvatarMenu] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { user, userInfo, isAdmin, loading, logout } = useAccount();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const [ordersToReview, setOrdersToReview] = useState<number>(0);
  const router = useRouter();

  // Fetch count of 'pagato' orders for admin badge
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!isAdmin) { setOrdersToReview(0); return; }
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
        const ordersCol = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_DB as string | undefined;
        if (!dbId || !ordersCol) { setOrdersToReview(0); return; }
        const res = await databases.listDocuments(dbId, ordersCol, [Query.equal('status', 'pagato'), Query.limit(1)]);
        if (!cancelled) setOrdersToReview(Number(res.total || 0));
      } catch {
        if (!cancelled) setOrdersToReview(0);
      }
    }
    run();
    const t = setInterval(run, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, [isAdmin]);

  // Chiudi il menu avatar se clicchi fuori
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenu(false);
      }
    }
    if (avatarMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarMenu]);

  const menuItems = [
    { name: 'Home', href: '#home', icon: Home },
    { name: 'Shop', href: '#shop', icon: ShoppingBag },
    { name: 'Personalizza', href: '#customize', icon: Palette },
    { name: 'About', href: '#about', icon: Info },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Stem
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ y: -2 }}
                className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors duration-200"
              >
                <item.icon size={16} />
                <span className="font-medium">{item.name}</span>
              </motion.a>
            ))}
          </nav>

          {/* Account Buttons o Avatar */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? null : user ? (
              <div className="relative" ref={avatarRef}>
                <button
                  className="flex items-center space-x-2 px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
                  onClick={() => setAvatarMenu((v) => !v)}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6D28D9&color=fff&size=32`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-purple-200"
                  />
                  <span className="font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {avatarMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/cart'); setAvatarMenu(false); }}
                      className="w-full text-left flex items-center px-4 py-2 text-purple-700 hover:bg-purple-50 transition-colors font-semibold border-b border-purple-100 cursor-pointer"
                    >
                      <span className="relative inline-flex items-center">
                        <ShoppingBag size={16} className="mr-2" />
                        Carrello
                        {cartCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-purple-600 text-white text-xs font-semibold">{cartCount}</span>
                        )}
                      </span>
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); console.log('[dropdown] click: shipping-info (desktop)'); router.push('/shipping-info'); setAvatarMenu(false); }}
                      className="w-full text-left flex items-center px-4 py-2 text-blue-700 hover:bg-blue-50 transition-colors font-semibold border-b border-blue-100 cursor-pointer"
                    >
                      <Info size={16} className="mr-2" />
                      Info Spedizione
                    </button>
                    {isAdmin ? (
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); console.log('[dropdown] click: admin/dashboard (desktop)'); router.push('/admin'); setAvatarMenu(false); }}
                        className="w-full text-left flex items-center px-4 py-2 text-yellow-700 hover:bg-yellow-50 transition-colors font-semibold border-b border-yellow-100 cursor-pointer"
                      >
                        <span className="relative inline-flex items-center">
                          <List size={16} className="mr-2" />
                          Dashboard
                          {ordersToReview > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                              {ordersToReview}
                            </span>
                          )}
                        </span>
                      </button>
                    ) : (
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); console.log('[dropdown] click: orders (desktop)'); router.push('/orders'); setAvatarMenu(false); }}
                        className="w-full text-left flex items-center px-4 py-2 text-yellow-700 hover-bg-yellow-50 transition-colors font-semibold border-b border-yellow-100 cursor-pointer"
                      >
                        <List size={16} className="mr-2" />
                        I miei ordini
                      </button>
                    )}
                    <button
                      onMouseDown={async (e) => { e.preventDefault(); e.stopPropagation(); console.log('[dropdown] click: logout (desktop)'); setAvatarMenu(false); await logout(); router.push('/'); }}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    startContent={<User size={16} />}
                    className="text-gray-700 hover:text-purple-600 rounded-full"
                  >
                    Accedi
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full"
                  >
                    Registrati
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Controls: auth + menu */}
          <div className="md:hidden flex items-center space-x-2">
            {loading ? null : user ? (
              <div className="relative" ref={avatarRef}>
                <button
                  className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-all"
                  onClick={() => setAvatarMenu((v) => !v)}
                  aria-label="Account"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6D28D9&color=fff&size=28`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border-2 border-purple-200"
                  />
                </button>
                {avatarMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                    <Link href="/cart" className="flex items-center px-4 py-2 text-purple-700 hover:bg-purple-50 transition-colors font-semibold border-b border-purple-100">
                      <span className="relative inline-flex items-center">
                        <ShoppingBag size={16} className="mr-2" />
                        Carrello
                        {cartCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-purple-600 text-white text-xs font-semibold">{cartCount}</span>
                        )}
                      </span>
                    </Link>
                    <a
                      href="/shipping-info"
                      className="flex items-center px-4 py-2 text-blue-700 hover:bg-blue-50 transition-colors font-semibold border-b border-blue-100"
                    >
                      <Info size={16} className="mr-2" />
                      Info Spedizione
                    </a>
                    {isAdmin ? (
                      <a
                        href="/admin"
                        className="flex items-center px-4 py-2 text-yellow-700 hover:bg-yellow-50 transition-colors font-semibold border-b border-yellow-100"
                      >
                        <span className="relative inline-flex items-center">
                          <List size={16} className="mr-2" />
                          Dashboard
                          {ordersToReview > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                              {ordersToReview}
                            </span>
                          )}
                        </span>
                      </a>
                    ) : (
                      <a
                        href="/orders"
                        className="flex items-center px-4 py-2 text-yellow-700 hover:bg-yellow-50 transition-colors font-semibold border-b border-yellow-100"
                      >
                        <List size={16} className="mr-2" />
                        I miei ordini
                      </a>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    startContent={<User size={16} />}
                    className="text-gray-700 hover:text-purple-600 rounded-full"
                  >
                    Accedi
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full"
                  >
                    Registrati
                  </Button>
                </Link>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors duration-200 py-2"
                >
                  <item.icon size={16} />
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
              {user && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link href="/shipping-info" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      className="w-full text-blue-700 hover:text-blue-900 rounded-full justify-start"
                      variant="ghost"
                      startContent={<Info size={16} />}
                    >
                      Info Spedizione
                    </Button>
                  </Link>
                  {isAdmin ? (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        className="w-full text-yellow-700 hover:text-yellow-900 rounded-full justify-start"
                        variant="ghost"
                        startContent={<List size={16} />}
                      >
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/orders" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        className="w-full text-yellow-700 hover:text-yellow-900 rounded-full justify-start"
                        variant="ghost"
                        startContent={<List size={16} />}
                      >
                        I miei ordini
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => { setIsMenuOpen(false); logout(); }}
                    className="w-full text-red-600 hover:text-red-700 rounded-full justify-start"
                    variant="ghost"
                    startContent={<LogOut size={16} />}
                  >
                    Logout
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;