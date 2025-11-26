"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, USER_COLLECTION, ADMINS_DB, createUserInfo } from "./auth/supabaseClient";
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, unknown>;
}

export interface UserInfo {
  $id: string;
  uuid: string;
  name: string;
  email: string;
  phone_number: string;
  street_address: string;
  apartment_number: string;
  nation: string;
  state: string;
  postal_code: string | null;
  shipping_info: boolean;
  name_surname: string | null;
}

interface AccountContextType {
  user: User | null;
  userInfo: UserInfo | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  user: null,
  userInfo: null,
  isAdmin: false,
  loading: true,
  refresh: () => {},
  logout: async () => {},
});

export const useAccount = () => useContext(AccountContext);

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      // Get current user from Supabase
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !supabaseUser) {
        setUser(null);
        setUserInfo(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Transform Supabase user to our User interface
      const transformedUser: User = {
        $id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
        email: supabaseUser.email || '',
        emailVerification: supabaseUser.email_confirmed_at !== null,
        prefs: supabaseUser.user_metadata || {},
      };
      
      setUser(transformedUser);
      
      // Check if user is admin by querying the admins table
      try {
        const { data: adminRecord, error: adminError } = await supabase
          .from(ADMINS_DB)
          .select('user_uuid')
          .eq('user_uuid', supabaseUser.id)
          .maybeSingle();
        
        if (adminError) {
          console.error('Error checking admin status:', adminError);
          setIsAdmin(false);
        } else {
          // User is admin if a record exists in the admins table
          setIsAdmin(!!adminRecord);
        }
      } catch (adminCheckError) {
        console.error('Error in admin check:', adminCheckError);
        setIsAdmin(false);
      }
      
      // Check if there's a processing flag
      const isProcessing = typeof window !== 'undefined' ? localStorage.getItem('user_info_processing') : null;
      if (isProcessing) {
        console.log("Processo user_info in corso, skip fetch");
        setUserInfo(null);
        setLoading(false);
        return;
      }
      
      // Fetch user_info from database
      const { data: userInfoData, error: infoError } = await supabase
        .from(USER_COLLECTION)
        .select('*')
        .eq('uuid', supabaseUser.id)
        .maybeSingle();
      
      if (infoError) {
        console.error("Error fetching user_info:", infoError);
        setUserInfo(null);
      } else if (!userInfoData) {
        // No user_info found - let auth pages handle creation
        setUserInfo(null);
      } else {
        // Transform database row to UserInfo interface
        setUserInfo({
          $id: userInfoData.id?.toString() || '',
          uuid: userInfoData.uuid,
          name: userInfoData.name || transformedUser.name,
          email: userInfoData.email || transformedUser.email,
          phone_number: userInfoData.phone_number,
          street_address: userInfoData.street_address,
          apartment_number: userInfoData.apartment_number,
          nation: userInfoData.nation,
          state: userInfoData.state,
          postal_code: userInfoData.postal_code,
          shipping_info: userInfoData.shipping_info,
          name_surname: userInfoData.name_surname,
        });
      }
    } catch (e) {
      console.error("Error in fetchUser:", e);
      setUser(null);
      setUserInfo(null);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setUserInfo(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = () => fetchUser();

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setUser(null);
      setUserInfo(null);
      setIsAdmin(false);
    }
  };

  return (
    <AccountContext.Provider value={{ user, userInfo, isAdmin, loading, refresh, logout }}>
      {children}
    </AccountContext.Provider>
  );
};
