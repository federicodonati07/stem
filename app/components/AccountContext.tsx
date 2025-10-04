"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { account, databases, createUserInfo, Query } from "./auth/appwriteClient";

export interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, any>;
  // puoi aggiungere altri campi se vuoi
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
  postal_code: number | null;
  shipping_info: boolean;
}

interface AccountContextType {
  user: User | null;
  userInfo: UserInfo | null;
  loading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  user: null,
  userInfo: null,
  loading: true,
  refresh: () => {},
  logout: async () => {},
});

export const useAccount = () => useContext(AccountContext);

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await account.get();
      setUser(res as User);
      
      // Controlla se c'è un processo di creazione user_info in corso
      const isProcessing = localStorage.getItem('user_info_processing');
      if (isProcessing) {
        console.log("Processo user_info in corso, skip fetch");
        setUserInfo(null);
        setLoading(false);
        return;
      }
      
      // Fetch user_info
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
      const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;
      const infoRes = await databases.listDocuments(dbId, colId, [
        Query.equal("uuid", res.$id)
      ]);
      if (infoRes.total === 0) {
        // Non creare automaticamente user_info qui - lascia che sia gestito dalle pagine di auth
        setUserInfo(null);
      } else {
        setUserInfo(infoRes.documents[0] as UserInfo || null);
      }
    } catch (e) {
      setUser(null);
      setUserInfo(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refresh = () => fetchUser();

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
    setUserInfo(null);
  };

  return (
    <AccountContext.Provider value={{ user, userInfo, loading, refresh, logout }}>
      {children}
    </AccountContext.Provider>
  );
};
