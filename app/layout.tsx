import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeroUIProvider } from "@heroui/react";
import { AccountProvider } from "./components/AccountContext";
import ShippingInfoGuard from "./components/ShippingInfoGuard";
import { CartProvider } from "./components/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stem - Sticker e Oggetti Personalizzabili",
  description: "Crea e personalizza i tuoi sticker e oggetti unici con Stem. Design moderno, qualità premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeroUIProvider>
          <AccountProvider>
            <CartProvider>
              <ShippingInfoGuard>
                {children}
              </ShippingInfoGuard>
            </CartProvider>
          </AccountProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
