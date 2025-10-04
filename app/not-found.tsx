"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white mb-6">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pagina non trovata</h1>
        <p className="text-gray-600 mb-8">La pagina che cerchi potrebbe essere stata spostata o non esistere.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button startContent={<ArrowLeft size={16} />} className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              Torna alla Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
