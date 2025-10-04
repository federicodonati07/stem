"use client";

import { useAccount } from "../components/AccountContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import Select from "react-select";
import countryList from "react-select-country-list";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import * as CRD from "country-region-data";
import Script from "next/script";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import { Country, State } from "country-state-city";
import { databases, account, ID, Query } from "../components/auth/appwriteClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Fallback robusto per i dati country/region (supporta named o default export)
const REGIONS_DATA: any[] = (CRD as any)?.CountryRegionData || (CRD as any)?.default || [];

// Nations source: keep react-select-country-list for labels, but we rely on CSC for ISO codes
const nationOptions = countryList().getData();

function getRegionsForCountryCode(code: string) {
  const iso = (code || "").toUpperCase();
  try {
    const states = State.getStatesOfCountry(iso) || [];
    return states.map((s) => ({ value: s.name, label: s.name }));
  } catch {
    return [];
  }
}

// Child component that uses Google Places only when rendered
function AddressAutocomplete({
  initialValue,
  onSelect,
  inputClass,
  onFocus,
  onBlur,
}: {
  initialValue: string;
  onSelect: (payload: { description: string; country?: string; region?: string; postal?: string }) => void;
  inputClass: string;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const { value, setValue, suggestions, clearSuggestions } = usePlacesAutocomplete({ debounce: 300 });
  const [selecting, setSelecting] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (initialValue && value !== initialValue) setValue(initialValue, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const geocodeAndSelect = async (description: string) => {
    try {
      const results = await getGeocode({ address: description });
      if (results && results[0]) {
        const comps = results[0].address_components;
        const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name || "";
        const country = get("country");
        const region = get("administrative_area_level_1") || get("administrative_area_level_2");
        const postal = get("postal_code");
        onSelect({ description, country, region, postal });
        return;
      }
    } catch {}
    onSelect({ description });
  };

  const handleSelect = async (description: string) => {
    setSelecting(true);
    setValue(description, false);
    clearSuggestions();
    await geocodeAndSelect(description);
    setSelecting(false);
  };

  const handleBlur = async () => {
    if (selecting) {
      setSelecting(false);
      setFocused(false);
      onBlur();
      return;
    }
    const description = value?.trim();
    if (description && description.length > 3) {
      await geocodeAndSelect(description);
    }
    setFocused(false);
    onBlur();
  };

  return (
    <div className="relative">
      <input
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Inizia a digitare l'indirizzo..."
        className={inputClass}
        onFocus={() => { setFocused(true); onFocus(); }}
        onBlur={handleBlur}
      />
      {focused && value.trim().length >= 3 && suggestions.status === "OK" && suggestions.data.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.data.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setSelecting(true); }}
              onClick={() => handleSelect(s.description)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
            >
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShippingInfoPage() {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { user, userInfo, loading } = useAccount();
  const [form, setForm] = useState({
    name_surname: "",
    phone_number: "",
    street_address: "",
    apartment_number: "",
    nation: "",
    state: "",
    postal_code: "",
  });
  const [nationCode, setNationCode] = useState<string>("");
  const [editField, setEditField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [regionOptions, setRegionOptions] = useState<{ value: string; label: string }[]>([]);
  const router = useRouter();

  const [original, setOriginal] = useState({
    name_surname: "",
    phone_number: "",
    street_address: "",
    apartment_number: "",
    nation: "",
    state: "",
    postal_code: "",
  });

  // OSM fallback state
  const [osmQuery, setOsmQuery] = useState("");
  const [osmResults, setOsmResults] = useState<any[]>([]);
  const [osmSelecting, setOsmSelecting] = useState(false);
  const [osmFocused, setOsmFocused] = useState(false);

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      borderColor: state.isFocused ? "#7c3aed" : "#d1d5db",
      borderWidth: 1,
      boxShadow: "none",
      borderRadius: 12,
      minHeight: 48,
      outline: "none",
      ":hover": { borderColor: state.isFocused ? "#7c3aed" : "#cbd5e1" },
    }),
    placeholder: (base: any) => ({ ...base, color: "#6b7280", fontWeight: 500 }),
    singleValue: (base: any) => ({ ...base, color: "#0f172a", fontWeight: 600 }),
    input: (base: any) => ({ ...base, color: "#0f172a", fontWeight: 600 }),
    menu: (base: any) => ({ ...base, borderRadius: 12, overflow: "hidden" }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#ede9fe" : state.isFocused ? "#f5f3ff" : "#ffffff",
      color: state.isSelected ? "#6d28d9" : "#0f172a",
      fontWeight: state.isSelected ? 700 : 600,
    }),
  } as const;

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (!loading && userInfo) {
      setForm({
        name_surname: (userInfo as any).name_surname || "",
        phone_number: userInfo.phone_number || "",
        street_address: userInfo.street_address || "",
        apartment_number: userInfo.apartment_number || "",
        nation: userInfo.nation || "",
        state: userInfo.state || "",
        postal_code: userInfo.postal_code ? String(userInfo.postal_code) : "",
      });
      setOriginal({
        name_surname: (userInfo as any).name_surname || "",
        phone_number: userInfo.phone_number || "",
        street_address: userInfo.street_address || "",
        apartment_number: userInfo.apartment_number || "",
        nation: userInfo.nation || "",
        state: userInfo.state || "",
        postal_code: userInfo.postal_code ? String(userInfo.postal_code) : "",
      });
      // Deriva il codice nazione a partire dal nome salvato
      const opt = nationOptions.find((o) => o.label === (userInfo.nation || ""));
      setNationCode(opt?.value || "");
      setIsNew(!userInfo.shipping_info);
      setOsmQuery(userInfo.street_address || "");
    }
  }, [user, userInfo, loading, router]);

  useEffect(() => {
    const regions = nationCode ? getRegionsForCountryCode(nationCode) : [];
    setRegionOptions(regions);
    if (regions.length === 0 && form.state) setForm((p) => ({ ...p, state: "" }));
  }, [nationCode]);

  const validate = (f = form) => {
    if (!f.name_surname || f.name_surname.trim().length < 2 || f.name_surname.length > 50) return "Nome e cognome non valido (max 50)";
    if (!/^\+\d{6,16}$/.test(f.phone_number)) return "Numero di telefono non valido (+ prefisso, max 16)";
    if (!f.street_address || f.street_address.length > 150) return "Indirizzo troppo lungo (max 150)";
    if (f.apartment_number.length > 10) return "Civico troppo lungo (max 10)";
    if (!f.nation || f.nation.length > 50) return "Nazione troppo lunga (max 50)";
    if (!f.state || f.state.length > 50) return "Regione/Stato troppo lungo (max 50)";
    if (!/^\d{1,10}$/.test(f.postal_code)) return "CAP non valido (solo numeri)";
    return null;
  };

  const isAllValid = (f = form) => validate(f) === null;

  const handleChange = (name: string, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  const norm = (name: string, value: string) => {
    if (name === "postal_code") return String(Number.parseInt(String(value || "0"), 10) || "");
    return String(value ?? "");
  };

  const isDirty = (name: string) => norm(name, (form as any)[name]) !== norm(name, (original as any)[name]);

  const updateBtnClass = (dirty: boolean) =>
    `${dirty ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-md" : "bg-gray-200 text-gray-500 border border-gray-300"} rounded-full h-12 px-5 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`;

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "name_surname":
        if (!value || value.trim().length < 2 || value.length > 50) return "Nome e cognome non valido (max 50)";
        return null;
      case "phone_number":
        return /^\+\d{6,16}$/.test(value) ? null : "Telefono non valido (+ prefisso, max 16)";
      case "street_address":
        return value && value.length <= 150 ? null : "Indirizzo non valido (max 150)";
      case "apartment_number":
        return value.length <= 10 ? null : "Civico troppo lungo (max 10)";
      case "nation":
        return value && value.length <= 50 ? null : "Nazione non valida (max 50)";
      case "state":
        return value && value.length <= 50 ? null : "Regione/Stato non valido (max 50)";
      case "postal_code":
        return /^\d{1,10}$/.test(String(value)) ? null : "CAP non valido";
      default:
        return null;
    }
  };

  async function ensureDocId(): Promise<string> {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
    const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;
    const uid = user?.$id || (await account.get()).$id;
    const res = await databases.listDocuments(dbId, colId, [Query.equal("uuid", uid)]);
    if (res.total > 0) return res.documents[0].$id as string;
    // create minimal using current form snapshot
    const created = await databases.createDocument(dbId, colId, ID.unique(), {
      uuid: uid,
      name_surname: (form.name_surname || "").slice(0, 50),
      phone_number: (form.phone_number || "").slice(0, 16),
      street_address: (form.street_address || "").slice(0, 150),
      apartment_number: (form.apartment_number || "").slice(0, 10),
      nation: (form.nation || "").slice(0, 50),
      state: (form.state || "").slice(0, 50),
      postal_code: Number.parseInt(String(form.postal_code || "0"), 10) || 0,
      shipping_info: isAllValid(form),
    });
    return created.$id as string;
  }

  async function updateSingleField(name: string, value: string) {
    const fieldError = validateField(name, value);
    if (fieldError) throw new Error(fieldError);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
    const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;
    const id = await ensureDocId();
    const next = { ...form, [name]: value } as any;
    const shippingOk = isAllValid(next);
    const payload: any = { shipping_info: shippingOk };
    if (name === "postal_code") payload[name] = Number.parseInt(String(value), 10) || 0; else payload[name] = value;
    await databases.updateDocument(dbId, colId, id, payload);
  }

  async function upsertUserInfo(payload: any) {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB!;
    const colId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!;
    let docId = (userInfo as any)?.$id as string | undefined;
    let userId = user?.$id;
    if (!docId) {
      try {
        if (!userId) {
          const u = await account.get();
          userId = u.$id;
        }
        const res = await databases.listDocuments(dbId, colId, [Query.equal("uuid", userId!)]);
        if (res.total > 0) docId = res.documents[0].$id;
      } catch {}
    }
    const data = {
      name_surname: (payload.name_surname || "").slice(0, 50),
      phone_number: (payload.phone_number || "").slice(0, 16),
      street_address: (payload.street_address || "").slice(0, 150),
      apartment_number: (payload.apartment_number || "").slice(0, 10),
      nation: (payload.nation || "").slice(0, 50),
      state: (payload.state || "").slice(0, 50),
      postal_code: Number.parseInt(String(payload.postal_code || "0"), 10) || 0,
      shipping_info: !!payload.shipping_info,
    };
    if (docId) {
      return databases.updateDocument(dbId, colId, docId, data);
    }
    // create if not exists
    const uid = userId || (await account.get()).$id;
    return databases.createDocument(dbId, colId, ID.unique(), {
      ...data,
      uuid: uid,
    });
  }

  // OSM autocomplete
  useEffect(() => {
    if (mapsKey) return;
    const controller = new AbortController();
    const q = osmQuery.trim();
    if (q.length < 3) {
      setOsmResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal, headers: { "Accept-Language": "it,en" } });
        const data = await res.json();
        setOsmResults(Array.isArray(data) ? data : []);
      } catch {}
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [osmQuery, mapsKey]);

  const handleSelectOsm = (item: any) => {
    const addr = item?.address || {};
    const display = item?.display_name || "";
    handleChange("street_address", display);
    setOsmQuery(display);
    if (addr.country) handleChange("nation", addr.country);
    if (addr.state || addr.county) handleChange("state", addr.state || addr.county);
    if (addr.postcode) handleChange("postal_code", addr.postcode);
    setOsmResults([]);
  };

  const inputBase = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 font-semibold outline-none";

  // Save and update handlers remain
  const handleSaveAll = async (e: any) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) return setError(err);
    try {
      await upsertUserInfo({ ...form, shipping_info: true });
    setSuccess(true);
      setIsNew(false);
      setOriginal({ ...form });
      setTimeout(() => setSuccess(false), 1200);
    } catch (e: any) {
      setError(e?.message || "Errore durante il salvataggio");
    }
  };

  const handleUpdateField = async (field: string) => {
    setError(null);
    try {
      await updateSingleField(field, (form as any)[field]);
    setSuccess(true);
      setOriginal((prev) => ({ ...prev, [field]: (form as any)[field] }));
    setEditField(null);
    setTimeout(() => setSuccess(false), 1000);
    } catch (e: any) {
      setError(e?.message || "Errore durante l'aggiornamento");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-gray-600">Caricamento...</span>
      </div>
    );
  }

  return (
    <>
      {mapsKey ? <Script src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`} strategy="afterInteractive" /> : null}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="ghost" startContent={<ArrowLeft size={16} />} className="rounded-full text-gray-700 hover:text-purple-600">Torna alla Home</Button>
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600" />

            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Info Spedizione</h1>
              <p className="text-sm text-gray-600 mt-1">{isNew ? "Inserisci i dati per velocizzare i prossimi ordini" : "Aggiorna i tuoi dati di spedizione"}</p>
            </div>

      <form className="space-y-6" onSubmit={handleSaveAll}>
              {/* Nome e Cognome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome e cognome</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.name_surname}
                    onChange={(e) => handleChange("name_surname", e.target.value)}
                    maxLength={100}
                    className={inputBase + " flex-1"}
                    onFocus={() => setEditField("name_surname")}
                    onBlur={() => setEditField(null)}
                    required
                  />
                  {!isNew && (
                    <Button size="sm" isDisabled={!isDirty("name_surname")} className={updateBtnClass(isDirty("name_surname"))} onClick={() => handleUpdateField("name_surname")}>
                      Aggiorna
                    </Button>
                  )}
                </div>
              </div>

        {/* Telefono con prefisso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numero di telefono</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
          <PhoneInput
            country={form.nation ? form.nation.toLowerCase() : "it"}
            value={form.phone_number}
                      onChange={(val) => handleChange("phone_number", "+" + val.replace(/^\+/, ""))}
                      inputClass={`!${inputBase} !h-12`}
                      buttonClass="!rounded-xl !border !border-gray-300"
            inputProps={{ name: "phone_number", required: true }}
            specialLabel=""
            enableSearch
            disableDropdown={false}
          />
                  </div>
                  {!isNew && (
                    <Button size="sm" isDisabled={!isDirty("phone_number")} className={updateBtnClass(isDirty("phone_number"))} onClick={() => handleUpdateField("phone_number")}>
                      Aggiorna
                    </Button>
          )}
        </div>
              </div>

              {/* Indirizzo: Google o OSM */}
              <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Indirizzo</label>
                {mapsKey ? (
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div className="flex-1">
                      <AddressAutocomplete
                        initialValue={form.street_address}
                        inputClass={inputBase}
            onFocus={() => setEditField("street_address")}
            onBlur={() => setEditField(null)}
                        onSelect={({ description, country, region, postal }) => {
                          handleChange("street_address", description);
                          if (country) {
                            handleChange("nation", country);
                            const opt = nationOptions.find((o) => o.label === country);
                            const code = (opt?.value || "").toUpperCase();
                            setNationCode(code);
                            setRegionOptions(getRegionsForCountryCode(code));
                          }
                          if (region) handleChange("state", region);
                          if (postal) handleChange("postal_code", postal);
                        }}
                      />
                    </div>
                    {!isNew && (
                      <Button size="lg" isDisabled={!isDirty("street_address")} className={updateBtnClass(isDirty("street_address"))} onClick={() => handleUpdateField("street_address")}>
                        Aggiorna
                      </Button>
          )}
        </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-nowrap">
                      <input
            type="text"
                        value={osmQuery}
                        onChange={(e) => setOsmQuery(e.target.value)}
                        placeholder="Inizia a digitare l'indirizzo..."
                        className={inputBase + " flex-1"}
                        onFocus={() => { setEditField("street_address"); setOsmFocused(true); }}
                        onBlur={async () => {
                          if (osmSelecting) { setOsmSelecting(false); setEditField(null); setOsmFocused(false); return; }
                          const q = osmQuery.trim();
                          if (q.length > 3) {
                            try {
                              const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;
                              const res = await fetch(url, { headers: { "Accept-Language": "it,en" } });
                              const data = await res.json();
                              if (Array.isArray(data) && data[0]) {
                                const addr = data[0].address || {};
                                handleChange("street_address", data[0].display_name || q);
                                if (addr.country) {
                                  handleChange("nation", addr.country);
                                  const opt = nationOptions.find((o) => o.label === addr.country);
                                  const code = (addr.country_code?.toUpperCase?.() as string) || (opt?.value || "").toUpperCase();
                                  setNationCode(code);
                                  setRegionOptions(getRegionsForCountryCode(code));
                                }
                                if (addr.state || addr.county) handleChange("state", addr.state || addr.county);
                                if (addr.postcode) handleChange("postal_code", addr.postcode);
                              }
                            } catch {}
                          }
                          setEditField(null);
                          setOsmFocused(false);
                        }}
                      />
                      {!isNew && (
                        <Button size="lg" isDisabled={!isDirty("street_address")} className={updateBtnClass(isDirty("street_address"))} onClick={() => handleUpdateField("street_address")}>
                          Aggiorna
                        </Button>
                      )}
                    </div>
                    {osmFocused && osmQuery.trim().length >= 3 && osmResults.length > 0 && (
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {osmResults.map((r) => (
                          <button
                            key={r.place_id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setOsmSelecting(true); }}
                            onClick={() => {
                              handleSelectOsm(r);
                              const addr = r.address || {};
                              const opt = nationOptions.find((o) => o.label === addr.country);
                              const code = (addr.country_code?.toUpperCase?.() as string) || (opt?.value || "").toUpperCase();
                              setNationCode(code);
                              setRegionOptions(getRegionsForCountryCode(code));
                              setOsmFocused(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                          >
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
          )}
        </div>

        {/* Nazione */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nazione</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
          <Select
            options={nationOptions}
                      value={nationOptions.find((opt) => opt.label === form.nation) || null}
                      onChange={(opt: any) => {
                        const label = opt?.label || "";
                        const code = (opt?.value || "").toUpperCase();
                        handleChange("nation", label);
                        setNationCode(code);
                        const regs = getRegionsForCountryCode(code);
                        setRegionOptions(regs);
                        handleChange("state", "");
                      }}
            classNamePrefix="react-select"
            placeholder="Seleziona nazione"
            isSearchable
                      styles={selectStyles as any}
            onFocus={() => setEditField("nation")}
            onBlur={() => setEditField(null)}
          />
                  </div>
                  {!isNew && (
                    <Button size="sm" isDisabled={!isDirty("nation")} className={updateBtnClass(isDirty("nation"))} onClick={() => handleUpdateField("nation")}>
                      Aggiorna
                    </Button>
          )}
        </div>
              </div>

        {/* Regione/State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Regione / Stato</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
          <Select
            options={regionOptions}
                      value={regionOptions.find((opt) => opt.label === form.state) || null}
                      onChange={(opt: any) => handleChange("state", opt?.label || "")}
            classNamePrefix="react-select"
                      placeholder={regionOptions.length > 0 ? "Seleziona regione" : "Nessuna regione disponibile"}
            isSearchable
                      isDisabled={regionOptions.length === 0}
                      styles={selectStyles as any}
            onFocus={() => setEditField("state")}
            onBlur={() => setEditField(null)}
          />
                  </div>
                  {!isNew && (
                    <Button size="sm" disabled={regionOptions.length === 0 || !isDirty("state")} className={updateBtnClass(regionOptions.length > 0 && isDirty("state"))} onClick={() => handleUpdateField("state")}>
                      Aggiorna
                    </Button>
          )}
        </div>
              </div>

        {/* CAP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CAP</label>
                <div className="flex items-center gap-2">
                  <input
            type="number"
            value={form.postal_code}
                    onChange={(e) => handleChange("postal_code", e.target.value)}
                    className={inputBase + " flex-1"}
            onFocus={() => setEditField("postal_code")}
            onBlur={() => setEditField(null)}
                    required
                  />
                  {!isNew && (
                    <Button size="sm" isDisabled={!isDirty("postal_code")} className={updateBtnClass(isDirty("postal_code"))} onClick={() => handleUpdateField("postal_code")}>
                      Aggiorna
                    </Button>
                  )}
                </div>
              </div>

              {/* Civico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Civico</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.apartment_number}
                    onChange={(e) => handleChange("apartment_number", e.target.value)}
                    placeholder="Civico"
                    maxLength={10}
                    className={inputBase + " flex-1"}
                    onFocus={() => setEditField("apartment_number")}
            onBlur={() => setEditField(null)}
          />
                  {!isNew && (
                    <Button size="sm" isDisabled={!isDirty("apartment_number")} className={updateBtnClass(isDirty("apartment_number"))} onClick={() => handleUpdateField("apartment_number")}>
                      Aggiorna
                    </Button>
          )}
        </div>
              </div>

              {error && <div className="text-red-600 font-semibold">{error}</div>}
              {success && <div className="text-green-600 font-semibold">Dati salvati!</div>}

        {isNew ? (
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full mt-2 font-semibold">Salva info spedizione</Button>
        ) : null}
      </form>
    </div>
        </div>
      </div>
    </>
  );
}



