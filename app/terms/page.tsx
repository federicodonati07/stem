"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />} className="rounded-full text-gray-700 hover:text-purple-600">Torna alla Home</Button>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termini e Condizioni d&apos;Uso</h1>
          <p className="text-gray-600 mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString()}</p>

          <section className="space-y-6 text-gray-800 leading-7">
            <h2 className="text-xl font-semibold text-gray-900">1. Oggetto</h2>
            <p>
              I presenti Termini regolano l&apos;accesso e l&apos;utilizzo del sito e dei servizi offerti da Stem. Accedendo al sito, accetti integralmente i Termini.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">2. Account e idoneità</h2>
            <p>
              Per alcune funzionalità è necessario creare un account, fornendo informazioni accurate e aggiornate. L&apos;utente è responsabile della sicurezza delle proprie credenziali.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">3. Ordini e pagamenti</h2>
            <p>
              Gli ordini sono soggetti a disponibilità e conferma. I pagamenti sono gestiti da provider terzi e sono soggetti alle loro condizioni.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">4. Spedizioni e consegna</h2>
            <p>
              Le spedizioni vengono effettuate tramite corrieri terzi. I tempi di consegna sono indicativi e possono variare. Il rischio di perdita o danneggiamento passa all&apos;utente al momento della consegna al vettore, salvo diverse disposizioni di legge applicabili.
            </p>
            <p className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              Condizioni di spedizione: l&apos;ente non è responsabile per consegne non pervenute dovute a indirizzi incompleti o errati forniti dall&apos;utente, assenza del destinatario o mancato ritiro nei termini previsti dal corriere. Eventuali riconsegne o giacenze possono comportare costi aggiuntivi a carico dell&apos;utente.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">5. Resi e rimborsi</h2>
            <p>
              Le politiche di reso e rimborso sono indicate nelle pagine informative del sito. Alcuni prodotti personalizzati potrebbero non essere idonei al reso, salvo difetti di conformità.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">6. Proprietà intellettuale</h2>
            <p>
              Tutti i contenuti presenti sul sito sono protetti da diritti di proprietà intellettuale. È vietato l&apos;uso non autorizzato.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">7. Limitazione di responsabilità</h2>
            <p>
              Nei limiti consentiti dalla legge, Stem non risponde per danni indiretti, consequenziali o perdita di profitti derivanti dall&apos;uso del sito o dei servizi.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">8. Modifiche ai Termini</h2>
            <p>
              Potremmo aggiornare i Termini in qualsiasi momento. Le modifiche avranno effetto dalla pubblicazione sul sito.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">9. Legge applicabile e foro</h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per ogni controversia è competente il foro del consumatore ove previsto dalla normativa.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
