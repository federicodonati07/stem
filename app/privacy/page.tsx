"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />} className="rounded-full text-gray-700 hover:text-purple-600">Torna alla Home</Button>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString()}</p>

          <section className="space-y-6 text-gray-800 leading-7">
            <p>
              La presente Informativa sulla Privacy descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali quando visiti il nostro sito o utilizzi i nostri servizi. Operiamo nel rispetto del Regolamento (UE) 2016/679 (GDPR) e delle normative applicabili.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">1. Titolare del trattamento</h2>
            <p>
              Per richieste sulla privacy puoi contattarci dall&apos;area account o tramite le sezioni di supporto del sito.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">2. Dati raccolti</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dati identificativi e di contatto (es. nome, email, indirizzo di spedizione)</li>
              <li>Dati di account e preferenze</li>
              <li>Dati di pagamento gestiti da provider terzi</li>
              <li>Dati tecnici (log, cookie, device e usage data)</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900">3. Finalità e basi giuridiche</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Erogazione dei servizi e adempimenti contrattuali</li>
              <li>Spedizione, assistenza clienti e gestione resi</li>
              <li>Adempimenti legali e fiscali</li>
              <li>Legittimo interesse per sicurezza, prevenzione abusi e miglioramento del servizio</li>
              <li>Marketing con consenso ove richiesto</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900">4. Conservazione</h2>
            <p>I dati vengono conservati per il tempo necessario alle finalità sopra descritte e nel rispetto degli obblighi di legge.</p>

            <h2 className="text-xl font-semibold text-gray-900">5. Condivisione con terzi</h2>
            <p>
              Condividiamo dati con fornitori e partner (es. logistica, pagamenti, hosting) solo per le finalità indicate e con adeguate misure contrattuali e tecniche.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">6. Trasferimenti extra-UE</h2>
            <p>
              Eventuali trasferimenti avvengono con garanzie adeguate (es. clausole contrattuali standard) e valutazioni di impatto ove necessario.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">7. Diritti degli interessati</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Accesso, rettifica, cancellazione, limitazione e portabilità</li>
              <li>Opposizione al trattamento basato su legittimo interesse</li>
              <li>Revoca del consenso ove applicabile</li>
              <li>Reclamo all’autorità di controllo competente</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900">8. Cookie</h2>
            <p>
              Utilizziamo cookie tecnici e, previo consenso, cookie di analisi e marketing. Puoi gestire le preferenze attraverso le impostazioni del browser o il banner dei cookie.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">9. Sicurezza</h2>
            <p>
              Adottiamo misure tecniche e organizzative adeguate per proteggere i dati personali da accessi non autorizzati, perdita o alterazione.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">10. Aggiornamenti</h2>
            <p>
              Potremmo aggiornare questa informativa periodicamente. Ti invitiamo a consultarla regolarmente.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
