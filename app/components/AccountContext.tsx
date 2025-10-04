"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { account, databases, createUserInfo, Query, teams } from "./auth/appwriteClient";

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
  name_surname: string | null
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
      const res = await account.get();
      setUser(res as User);
      
      // Controlla se l'utente è admin
      try {
        const teamId = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID || "admins";
        console.log("Controllo admin - Team ID:", teamId);
        
        // Metodo 1: Usa getMemberships per ottenere i team dell'utente corrente
        try {
          const userMemberships = await teams.getMemberships();
          const isUserAdmin = userMemberships.memberships.some(membership => 
            membership.teamId === teamId && membership.roles.includes("admin")
          );
          console.log("Memberships utente:", userMemberships.memberships);
          console.log("È admin (metodo 1):", isUserAdmin);
          setIsAdmin(isUserAdmin);
        } catch (membershipError) {
          console.log("Errore getMemberships, provo metodo alternativo:", membershipError);
          
          // Metodo 2: Prova a ottenere la membership specifica del team
          try {
            const teamMemberships = await teams.listMemberships(teamId);
            const isUserAdmin = teamMemberships.memberships.some(membership => 
              membership.userId === res.$id && membership.roles.includes("admin")
            );
            console.log("Team memberships:", teamMemberships.memberships);
            console.log("È admin (metodo 2):", isUserAdmin);
            setIsAdmin(isUserAdmin);
          } catch (listError) {
            console.log("Errore anche con listMemberships:", listError);
            setIsAdmin(false);
          }
        }
      } catch (teamError) {
        console.log("Errore generale nel controllo admin:", teamError);
        setIsAdmin(false);
      }
      
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
      setIsAdmin(false);
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
    setIsAdmin(false);
  };

  return (
    <AccountContext.Provider value={{ user, userInfo, isAdmin, loading, refresh, logout }}>
      {children}
    </AccountContext.Provider>
  );
};
