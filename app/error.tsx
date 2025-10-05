"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white mb-6">!</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Si è verificato un errore</h1>
        <p className="text-gray-600 mb-8">Qualcosa è andato storto. Riprova tra poco oppure torna alla Home.</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()} className="rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50">Riprova</Button>
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
