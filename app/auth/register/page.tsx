"use client";

import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { account, databases, ID, Query } from '../../components/auth/appwriteClient';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [processing, setProcessing] = React.useState(false);

  async function handleGoogleRegister() {
    // 1. Avvia OAuth Google
    await account.createOAuth2Session(
      "google",
      window.location.origin + "/auth/register?oauth=1", // redirect dopo login
      window.location.origin + "/auth/register?error=1"  // redirect dopo errore
    );
  }

  // 2. Dopo redirect, controlla se è la prima volta e crea user_info
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("oauth") === "1" && !processing) {
      setProcessing(true);
      
      // Usa un flag nel localStorage per prevenire creazioni multiple
      const processingKey = `processing_${Date.now()}`;
      localStorage.setItem('user_info_processing', processingKey);
      
      (async () => {
        try {
          const user = await account.get();
          const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
          const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;
          
          // Controlla se c'è già un processo in corso
          const currentProcessing = localStorage.getItem('user_info_processing');
          if (currentProcessing !== processingKey) {
            console.log("Processo già in corso, skip");
            router.replace("/");
            return;
          }
          
          // Cerca user_info per uuid
          const res = await databases.listDocuments(dbId, colId, [
            Query.equal("uuid", user.$id)
          ]);
          
          if (res.total === 0) {
            console.log("Creazione user_info per utente:", user.$id);
            // Crea user_info minimale
            await databases.createDocument(
              dbId,
              colId,
              ID.unique(), // ID unico per il documento
              {
                uuid: user.$id,
                phone_number: null,
                street_address: null,
                apartment_number: null,
                nation: null,
                state: null,
                postal_code: null,
                shipping_info: null,
              }
            );
            console.log("User_info creato con successo");
          } else {
            console.log("User_info già esistente per utente:", user.$id);
          }
          
          // Pulisci il flag
          localStorage.removeItem('user_info_processing');
          
          // Redirect alla home
          router.replace("/");
        } catch (err) {
          console.error("Errore durante la registrazione:", err);
          localStorage.removeItem('user_info_processing');
          setProcessing(false);
        }
      })();
    }
  }, [router, processing]);

  return (
    <AuthLayout
      title="Registrati su Stem"
      subtitle="Crea il tuo account con Google in un click"
    >
      <div className="flex flex-col items-center justify-center space-y-8 py-8">
        <GoogleAuthButton
          onClick={handleGoogleRegister}
          text="Registrati con Google"
        />
      </div>
    </AuthLayout>
  );
}