"use client";

import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { account, client, databases, ID, Query } from '../../components/auth/appwriteClient';
import { useRouter } from 'next/navigation';
import { OAuthProvider } from 'appwrite';

export default function LoginPage() {
  const router = useRouter();
  const [processing, setProcessing] = React.useState(false);

  async function handleGoogleLogin() {
    // 1. Avvia OAuth Google
    account.createOAuth2Session(
      OAuthProvider.Google,
      window.location.origin + "/auth/login?oauth=1", // redirect dopo login
      window.location.origin + "/auth/login?error=1" // redirect dopo errore

      
    );
    console.log(window.location.origin)
  }

  // 2. Dopo redirect: passa a JWT lato client, crea user_info se manca e reindirizza
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("oauth") === "1" && !processing) {
      setProcessing(true);

      const processingKey = `processing_${Date.now()}`;
      localStorage.setItem('user_info_processing', processingKey);

      (async () => {
        try {
          // Verifica sessione lato cookie (una volta)
          const user = await account.get();

          // Crea JWT e passa ad header Authorization (no cookie)
          const jwtRes = await account.createJWT();
          client.setJWT(jwtRes.jwt);
          try { localStorage.setItem('appwrite_jwt', jwtRes.jwt); } catch {}

          // Crea user_info minimale se assente
          const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
          const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;

          const currentProcessing = localStorage.getItem('user_info_processing');
          if (currentProcessing === processingKey) {
            const res = await databases.listDocuments(dbId, colId, [
              Query.equal("uuid", user.$id)
            ]);
            if (res.total === 0) {
              await databases.createDocument(
                dbId,
                colId,
                ID.unique(),
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
            }
          }

          // Pulisci flag
          localStorage.removeItem('user_info_processing');

          // Vai alla home
          router.replace("/");
        } catch (err) {
          console.error("Errore durante il login:", err);
          localStorage.removeItem('user_info_processing');
          setProcessing(false);
        }
      })();
    }
  }, [router, processing]);

  return (
    <AuthLayout
      title="Accedi a Stem"
      subtitle="Accedi rapidamente con il tuo account Google"
    >
      <div className="flex flex-col items-center justify-center space-y-8 py-8">
        <GoogleAuthButton
          onClick={handleGoogleLogin}
          text="Accedi con Google"
        />
      </div>
    </AuthLayout>
  );
}