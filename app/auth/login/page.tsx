"use client";

import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { account } from '../../components/auth/appwriteClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  async function handleGoogleLogin() {
    // 1. Avvia OAuth Google
    await account.createOAuth2Session(
      "google",
      window.location.origin + "/auth/login?oauth=1", // redirect dopo login
      window.location.origin + "/auth/login?error=1"  // redirect dopo errore
    );
  }

  // 2. Dopo redirect, controlla se l'utente è loggato e reindirizza
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("oauth") === "1") {
      (async () => {
        try {
          const user = await account.get();
          console.log("Utente loggato:", user);
          // Redirect alla home
          router.replace("/");
        } catch (err) {
          console.error("Errore durante il login:", err);
          // Gestisci errore - potresti mostrare un messaggio all'utente
        }
      })();
    }
  }, [router]);

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