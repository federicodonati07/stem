"use client";

import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { supabase, USER_COLLECTION } from '../../components/auth/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [processing, setProcessing] = React.useState(false);

  async function handleGoogleLogin() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/login?oauth=1`,
        }
      });
      
      if (error) {
        console.error('OAuth error:', error);
      }
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  }

  // Handle OAuth callback
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("oauth") === "1" && !processing) {
      setProcessing(true);

      const processingKey = `processing_${Date.now()}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_info_processing', processingKey);
      }

      (async () => {
        try {
          // Get the current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error("Error getting user:", userError);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_info_processing');
            }
            setProcessing(false);
            return;
          }

          // Check if user_info exists
          const currentProcessing = typeof window !== 'undefined' ? localStorage.getItem('user_info_processing') : null;
          
          if (currentProcessing === processingKey) {
            const { data: existingUserInfo, error: fetchError } = await supabase
              .from(USER_COLLECTION)
              .select('*')
              .eq('uuid', user.id)
              .maybeSingle();
            
            if (fetchError) {
              console.error("Error fetching user_info:", fetchError);
            }
            
            // Create user_info if it doesn't exist
            if (!existingUserInfo) {
              const { error: createError } = await supabase
                .from(USER_COLLECTION)
                .insert({
                  uuid: user.id,
                  name: user.user_metadata?.name || user.email?.split('@')[0] || '',
                  email: user.email || '',
                  phone_number: null,
                  street_address: null,
                  apartment_number: null,
                  nation: null,
                  state: null,
                  postal_code: null,
                  shipping_info: null,
                });
              
              if (createError) {
                console.error("Error creating user_info:", createError);
              }
            }
          }

          // Clear processing flag
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_info_processing');
          }

          // Redirect to home
          router.replace("/");
        } catch (err) {
          console.error("Error during login:", err);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_info_processing');
          }
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
