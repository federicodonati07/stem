"use client";

import { useAccount } from "./components/AccountContext";
import { databases } from "./components/auth/appwriteClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;

export default function ShippingInfoPage() {
  const { user, loading } = useAccount();
  const [form, setForm] = useState({
    phone_number: "",
    street_address: "",
    apartment_number: "",
    nation: "",
    state: "",
    postal_code: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!/^\+\d{1,15}$/.test(form.phone_number)) return "Numero di telefono non valido";
    if (!form.street_address || form.street_address.length > 150) return "Indirizzo troppo lungo";
    if (form.apartment_number.length > 10) return "Numero appartamento troppo lungo";
    if (!form.nation || form.nation.length > 50) return "Nazione troppo lunga";
    if (!form.state || form.state.length > 50) return "Stato troppo lungo";
    if (!/^\d{1,10}$/.test(form.postal_code)) return "CAP non valido";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    try {
      // Trova il documento user_info dell'utente
      const res = await databases.listDocuments(dbId, colId, [
        `uuid=${user!.$id}`
      ]);
      if (res.total === 0) throw new Error("Utente non trovato");
      const docId = res.documents[0].$id;
      await databases.updateDocument(dbId, colId, docId, {
        ...form,
        shipping_info: true,
      });
      setSuccess(true);
      setTimeout(() => router.replace("/"), 1500);
    } catch (e: any) {
      setError(e.message || "Errore generico");
    }
  };

  const handleSkip = () => {
    router.replace("/");
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Informazioni di spedizione</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="phone_number"
          placeholder="Numero di telefono (+...)"
          maxLength={16}
          value={form.phone_number}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <input
          type="text"
          name="street_address"
          placeholder="Indirizzo"
          maxLength={150}
          value={form.street_address}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <input
          type="text"
          name="apartment_number"
          placeholder="Numero appartamento (opzionale)"
          maxLength={10}
          value={form.apartment_number}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="text"
          name="nation"
          placeholder="Nazione"
          maxLength={50}
          value={form.nation}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <input
          type="text"
          name="state"
          placeholder="Stato"
          maxLength={50}
          value={form.state}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <input
          type="text"
          name="postal_code"
          placeholder="CAP"
          maxLength={10}
          value={form.postal_code}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        {error && <div className="text-red-600 font-medium">{error}</div>}
        {success && <div className="text-green-600 font-medium">Dati salvati! Reindirizzamento...</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Salta
          </button>
        </div>
      </form>
    </div>
  );
}



