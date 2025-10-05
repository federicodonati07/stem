"use client";

import { useAccount } from "../components/AccountContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Package, 
  Plus, 
  ShoppingCart, 
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Search,
  X
} from "lucide-react";
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { databases, storage, ID, Query } from "../components/auth/appwriteClient";
import Cropper from "react-easy-crop";

// MOCK DATA - Da sostituire con fetch da Appwrite
const mockOrders = [
  { id: "ORD-001", customer: "Mario Rossi", status: "In lavorazione", createdAt: "2024-06-01", total: "19.90€", items: 2 },
  { id: "ORD-002", customer: "Giulia Bianchi", status: "Spedito", createdAt: "2024-05-28", total: "45.50€", items: 4 },
  { id: "ORD-003", customer: "Luca Verdi", status: "Completato", createdAt: "2024-05-25", total: "32.00€", items: 3 },
];

const mockProducts = [
  { id: "PROD-001", name: "Sticker Personalizzato", price: "9.90€", stock: 150, category: "Stickers", status: "Attivo" },
  { id: "PROD-002", name: "Tazza Custom", price: "19.90€", stock: 45, category: "Tazze", status: "Attivo" },
  { id: "PROD-003", name: "T-Shirt Design", price: "29.90€", stock: 12, category: "Abbigliamento", status: "Esaurito" },
];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'create'>('orders');
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSeries, setUsersSeries] = useState<Array<{ date: string; count: number }>>([]);
  const [usersGrowth, setUsersGrowth] = useState<number | null>(null);

  // Create product form state
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Stickers");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pDescription, setPDescription] = useState("");
  const [pFile, setPFile] = useState<File | null>(null);
  const [pPreview, setPPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [pStatus, setPStatus] = useState(true);
  const [pPersonalizable, setPPersonalizable] = useState(false);
  const [pColorsArr, setPColorsArr] = useState<string[]>([]);
  const [pNewColor, setPNewColor] = useState<string>("#000000");
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const lastCropKeyRef = useRef<string | null>(null);
  // Products state
  type ProductDoc = {
    $id: string;
    name: string;
    description: string;
    price: string;
    stock: number;
    category: string;
    uuid: string;
    img_url: string;
    status: boolean;
    personalizable?: boolean;
    colors?: string[];
  };
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsSearch, setProductsSearch] = useState("");
  const [imgVersionMap, setImgVersionMap] = useState<Record<string, number>>({});

  function bumpImageVersion(uuid: string) {
    setImgVersionMap((prev) => ({ ...prev, [uuid]: (prev[uuid] || 0) + 1 }));
  }

  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB as string | undefined;
  const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB as string | undefined;
  const categoriesCol = process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_DB as string | undefined;
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_STORAGE as string | undefined;

  const fetchProducts = useCallback(async () => {
    if (!dbId || !productsCol) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await databases.listDocuments(dbId, productsCol, []);
      const list = (res.documents || []) as any[];
      const mapped: ProductDoc[] = list.map((d) => ({
        $id: d.$id,
        name: String(d.name ?? ""),
        description: String(d.description ?? ""),
        price: String(d.price ?? ""),
        stock: Number(d.stock ?? 0),
        category: String(d.category ?? ""),
        uuid: String(d.uuid ?? ""),
        img_url: String(d.img_url ?? "").split('?')[0],
        status: Boolean(d.status ?? true),
        personalizable: Boolean(d.personalizable ?? false),
        colors: Array.isArray(d.colors) ? d.colors.map((c: any) => String(c)) : [],
      }));
      setProducts(mapped);
    } catch (e) {
      setProductsError("Impossibile caricare i prodotti");
    } finally {
      setProductsLoading(false);
    }
  }, [dbId, productsCol]);

  // Categories state and CRUD
  type Category = { $id: string; name: string };
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryMsg, setCategoryMsg] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!dbId || !categoriesCol) return;
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await databases.listDocuments(dbId, categoriesCol, []);
      const list = (res.documents || []) as any[];
      const mapped: Category[] = list.map((d) => ({ $id: d.$id, name: String(d.name ?? "") }));
      // sort by name asc
      mapped.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(mapped);
    } catch {
      setCategoriesError("Impossibile caricare le categorie");
    } finally {
      setCategoriesLoading(false);
    }
  }, [dbId, categoriesCol]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function addCategory() {
    if (!dbId || !categoriesCol) return;
    const name = newCategory.trim().slice(0, 50);
    if (!name) return;
    try {
      await databases.createDocument(dbId, categoriesCol, ID.unique(), { name });
      setNewCategory("");
      setCategoryMsg("Categoria aggiunta");
      await fetchCategories();
      setPCategory(name);
    } catch {
      setCategoryMsg("Errore aggiunta categoria");
    }
  }

  async function removeCategoryById(id: string, name: string) {
    if (!dbId || !categoriesCol) return;
    try {
      await databases.deleteDocument(dbId, categoriesCol, id);
      await fetchCategories();
      if (pCategory === name) setPCategory("");
      setCategoryMsg("Categoria rimossa");
    } catch {
      setCategoryMsg("Errore rimozione categoria");
    }
  }

  async function waitForImageReachable(url: string, attempts = 8, delayMs = 400): Promise<boolean> {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return true;
      } catch {}
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return false;
  }

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productsFiltered = products.filter((p) =>
    !productsSearch ? true : p.name.toLowerCase().includes(productsSearch.toLowerCase())
  );

  async function toggleProductStatus(docId: string, next: boolean) {
    if (!dbId || !productsCol) return;
    try {
      await databases.updateDocument(dbId, productsCol, docId, { status: next });
      setProducts((prev) => prev.map((p) => (p.$id === docId ? { ...p, status: next } : p)));
    } catch {}
  }

  // Editing modal
  const [editing, setEditing] = useState<ProductDoc | null>(null);
  const [eName, setEName] = useState("");
  const [eCategory, setECategory] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eStock, setEStock] = useState(0);
  const [eDescription, setEDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  function openEdit(p: ProductDoc) {
    setEditing(p);
    setEName(p.name);
    setECategory(p.category);
    setEPrice(p.price);
    setEStock(p.stock);
    setEDescription(p.description);
  }

  async function updateField(docId: string, data: Partial<ProductDoc>) {
    if (!dbId || !productsCol) return;
    setUpdating(true);
    try {
      await databases.updateDocument(dbId, productsCol, docId, data as any);
      setProducts((prev) => prev.map((p) => (p.$id === docId ? { ...p, ...data } : p)));
    } catch {}
    setUpdating(false);
  }

  async function deleteProduct(doc: ProductDoc) {
    if (!dbId || !productsCol) return;
    setUpdating(true);
    try {
      if (bucketId) {
        try { await storage.deleteFile(bucketId, doc.uuid); } catch {}
      }
      await databases.deleteDocument(dbId, productsCol, doc.$id);
      setProducts(prev => prev.filter(p => p.$id !== doc.$id));
      setEditing(null);
    } catch {}
    setUpdating(false);
  }

  const handleOpenChange = useCallback((open: boolean) => {
    setShowCrop(prev => (prev === open ? prev : open));
  }, []);

  const handleCropComplete = useCallback((_: any, areaPixels: { width: number; height: number; x: number; y: number }) => {
    const key = `${Math.round(areaPixels.x)}-${Math.round(areaPixels.y)}-${Math.round(areaPixels.width)}-${Math.round(areaPixels.height)}`;
    if (lastCropKeyRef.current !== key) {
      lastCropKeyRef.current = key;
      setCroppedAreaPixels(areaPixels);
    }
  }, []);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  function normalizePrice(input: string) {
    // Consenti solo cifre, punto o virgola, max due decimali
    let v = input.replace(/[^0-9.,]/g, "");
    v = v.replace(",", ".");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    const [intp, decp] = v.split(".");
    const intNorm = (intp || "").replace(/^0+(\d)/, "$1");
    const decNorm = decp ? decp.slice(0, 2) : undefined;
    return decNorm !== undefined ? `${intNorm || "0"}.${decNorm}` : (intNorm || "");
  }

  async function getCroppedBlob(imageSrc: string, cropPx: { x: number; y: number; width: number; height: number } | null, mime: string): Promise<Blob> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = imageSrc;
    });
    const canvas = document.createElement('canvas');
    const area = cropPx ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
    canvas.width = area.width;
    canvas.height = area.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non disponibile');
    ctx.drawImage(
      img,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      area.width,
      area.height
    );
    const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), mime, 0.92));
    return blob;
  }

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  // Fetch totale utenti
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const res = await fetch('/api/admin/users-count', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setUsersTotal(typeof data?.total === 'number' ? data.total : 0);
      } catch {
        if (!cancelled) setUsersError('Impossibile caricare');
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  // Fetch serie e crescita utenti
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/admin/users-stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setUsersSeries(Array.isArray(data?.series) ? data.series : []);
        setUsersGrowth(typeof data?.growthPct === 'number' ? data.growthPct : 0);
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const UsersChart = ({ series }: { series: Array<{ date: string; count: number }> }) => {
    if (!series.length) return <div className="h-16" />;
    const data = series.map((s) => ({ date: s.date.slice(5), value: s.count }));
    return (
      <div className="mt-2">
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="usersGradientAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} formatter={(value: number) => [String(value), 'Registrazioni']} labelFormatter={(label: string) => `Giorno: ${label}`} />
              <Area type="monotone" dataKey="value" stroke="#16a34a" fill="url(#usersGradientAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-gray-500">Ultimi 30 giorni</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin w-8 h-8 text-purple-600 mb-2" />
        <span className="text-gray-600">Caricamento...</span>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
          <p className="text-gray-600 mb-4">Non hai i permessi per accedere a questa pagina.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
              Torna alla Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  startContent={<ArrowLeft size={16} />}
                  className="text-gray-600 hover:text-purple-600 rounded-full"
                >
                  Torna alla Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{user.name?.charAt(0)}</span>
              </div>
              <span className="text-gray-700 font-medium">{user.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ordini Totali</p>
                <p className="text-2xl font-bold text-gray-900">{mockOrders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prodotti</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ricavi</p>
                <p className="text-2xl font-bold text-gray-900">€2,847</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utenti registrati</p>
                <p className="text-2xl font-bold text-gray-900">{usersLoading ? '...' : (usersError ? '—' : String(usersTotal ?? 0))}</p>
                <p className={`text-sm ${Number(usersGrowth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {usersError || usersGrowth === null ? '' : `${usersGrowth >= 0 ? '+' : ''}${(usersGrowth ?? 0).toFixed(1)}%`}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <UsersChart series={usersSeries} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'orders', label: 'Ordini', icon: ShoppingCart },
                { id: 'products', label: 'Prodotti', icon: Package },
                { id: 'create', label: 'Crea Prodotto', icon: Plus },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'orders' | 'products' | 'create')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Ordini</h3>
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-semibold text-gray-900">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customer}</p>
                          <p className="text-xs text-gray-500">{order.createdAt} • {order.items} articoli</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completato' ? 'bg-green-100 text-green-700' :
                          order.status === 'Spedito' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                        <span className="font-bold text-gray-900">{order.total}</span>
                        <Button size="sm" variant="ghost" startContent={<Eye size={14} />} className="rounded-full">
                          Dettagli
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Prodotti</h3>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <Input
                    placeholder="Cerca per nome..."
                    value={productsSearch}
                    onValueChange={setProductsSearch}
                    startContent={<Search size={16} className="text-gray-400" />}
                    className="w-80"
                    classNames={{ input: "text-gray-900", inputWrapper: "border-gray-200 hover:border-purple-300 focus-within:border-purple-500" }}
                  />
                  {productsLoading ? <span className="text-sm text-gray-500">Caricamento...</span> : null}
                  {productsError ? <span className="text-sm text-red-600">{productsError}</span> : null}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Prodotto</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Categoria</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Prezzo</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Stock</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Stato</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsFiltered.map((product) => (
                        <tr key={product.$id} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => openEdit(product)}>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              <img key={`${product.uuid}-${imgVersionMap[product.uuid] || 0}`} src={`/api/media/products/${product.uuid}`} alt={product.name} className="w-9 h-9 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                              <span>{product.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{product.category}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{product.price}</td>
                          <td className="py-3 px-4 text-gray-600">{product.stock}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {product.status ? 'Attivo' : 'Disabilitato'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" className={`${product.status ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} rounded-full`}
                                onClick={(e) => { e.stopPropagation(); toggleProductStatus(product.$id, !product.status); }}
                              >
                                {product.status ? 'Disabilita' : 'Abilita'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crea Nuovo Prodotto</h3>
                <div className="max-w-2xl">
                  <form className="space-y-6" onSubmit={async (e) => {
                    e.preventDefault();
                    setCreateError(null);
                    setCreateSuccess(null);
                    // Validazioni
                    const name = pName.trim().slice(0, 50);
                    const description = pDescription.trim().slice(0, 500);
                    const price = normalizePrice(pPrice).slice(0, 150);
                    const category = pCategory.trim().slice(0, 50);
                    const stockNum = Number.parseInt(pStock, 10);
                    if (!name || !description || !price || Number.isNaN(stockNum) || !category || !pFile) {
                      setCreateError("Compila tutti i campi richiesti e seleziona un'immagine valida.");
                      return;
                    }
                    // File checks: solo PNG e max 50MB
                    const allowed = ["image/png"];
                    if (!allowed.includes(pFile.type)) {
                      setCreateError("Formato non supportato. Carica una immagine PNG.");
                      return;
                    }
                    if (pFile.size > 50 * 1024 * 1024) {
                      setCreateError("Immagine troppo grande (max 50MB)");
                      return;
                    }
                    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_STORAGE;
                    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DB;
                    const productsCol = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_DB;
                    if (!bucketId || !dbId || !productsCol) {
                      setCreateError("Configurazione Appwrite mancante (env variables)");
                      return;
                    }
                    setCreating(true);
                    try {
                      // Genera UUID per prodotto (usato anche come fileId)
                      const uuid = ID.unique();
                      // Colors opzionali
                      const colorsArr = pColorsArr.map(c => c.slice(0, 20));
                      // Prepara il file PNG finale (ritagliato o intero)
                      let finalBlob: Blob | null = null;
                      try {
                        const blob = await getCroppedBlob(pPreview || URL.createObjectURL(pFile), croppedAreaPixels, 'image/png');
                        finalBlob = blob;
                      } catch {
                        finalBlob = pFile; // fallback
                      }
                      if ((finalBlob?.size || 0) > 50 * 1024 * 1024) {
                        setCreateError("Immagine troppo grande dopo il ritaglio (max 50MB)");
                        setCreating(false);
                        return;
                      }
                      const uploadFile = new File([finalBlob as Blob], `${uuid}.png`, { type: 'image/png' });
                      await storage.createFile(bucketId, uuid, uploadFile, undefined, (prog) => {
                        setUploadProgress(Math.round(prog.progress));
                      });
                      // Ottieni URL visualizzazione
                      const imgUrl = storage.getFileView(bucketId, uuid);
                      const img_url = String(imgUrl).slice(0, 1500);
                      // Crea documento prodotto
                      await databases.createDocument(dbId, productsCol, ID.unique(), {
                        name,
                        description,
                        price,
                        stock: stockNum,
                        category,
                        uuid: uuid.slice(0, 500),
                        img_url,
                        status: !!pStatus,
                        personalizable: !!pPersonalizable,
                        colors: colorsArr,
                      });
                      setCreateSuccess("Prodotto creato con successo");
                      // Reset
                      setPName("");
                      setPCategory("Stickers");
                      setPPrice("");
                      setPStock("");
                      setPDescription("");
                      setPFile(null);
                      setPPreview(null);
                      setUploadProgress(0);
                      setPStatus(true);
                      setPPersonalizable(false);
                      setPColorsArr([]);
                      setPNewColor("#000000");
                      setShowCrop(false);
                      // Vai alla tab prodotti e ricarica
                      await fetchProducts();
                      setActiveTab('products');
                    } catch (err) {
                      const msg = (err as Error)?.message || "Errore durante la creazione";
                      setCreateError(msg);
                    } finally {
                      setCreating(false);
                    }
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Prodotto</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                          placeholder="Es. Sticker Personalizzato"
                          value={pName}
                          onChange={(e) => setPName(e.target.value)}
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900"
                          value={pCategory}
                          onChange={(e) => setPCategory(e.target.value)}
                        >
                          <option value="">Seleziona categoria</option>
                          {categories.map((c) => (
                            <option key={c.$id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                          <div className="flex items-center gap-2 md:col-span-2">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                              placeholder="Nuova categoria"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              maxLength={50}
                            />
                            <Button type="button" className="h-10 px-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white" disabled={!newCategory.trim()} onClick={addCategory}>Aggiungi</Button>
                          </div>
                          <div className="text-right md:text-left text-xs text-gray-500 self-center">{categoryMsg}</div>
                        </div>
                        {categories.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {categories.map((c) => (
                              <span key={c.$id} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${pCategory === c.name ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
                                <span className="text-sm text-gray-700">{c.name}</span>
                                <button type="button" className="text-gray-500 hover:text-red-600" onClick={() => removeCategoryById(c.$id, c.name)}>×</button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {categoriesLoading ? <p className="text-xs text-gray-500 mt-1">Caricamento categorie...</p> : null}
                        {categoriesError ? <p className="text-xs text-red-600 mt-1">{categoriesError}</p> : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo (€)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                          placeholder="9.90"
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Iniziale</label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                          placeholder="100"
                          value={pStock}
                          onChange={(e) => setPStock(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                        placeholder="Descrizione del prodotto..."
                        value={pDescription}
                        onChange={(e) => setPDescription(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-gray-700">Stato prodotto</label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={pStatus} onChange={(e) => setPStatus(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                        <span className="ml-3 text-sm text-gray-700">{pStatus ? 'Attivo' : 'Disabilitato'}</span>
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-gray-700">Personalizzabile</label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={pPersonalizable} onChange={(e) => setPPersonalizable(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                        <span className="ml-3 text-sm text-gray-700">{pPersonalizable ? 'Sì' : 'No'}</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Colori (opzionale)</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={pNewColor} onChange={(e) => setPNewColor(e.target.value)} className="h-10 w-14 rounded-lg border border-gray-300 bg-white" />
                        <Button type="button" className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white" onClick={() => {
                          const c = (pNewColor || "").trim();
                          if (!c) return;
                          if (pColorsArr.includes(c)) return;
                          setPColorsArr((prev) => [...prev, c].slice(0, 20));
                        }}>Aggiungi colore</Button>
                      </div>
                      {pColorsArr.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {pColorsArr.map((c, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: '#e5e7eb' }}>
                              <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }} />
                              <span className="text-sm text-gray-700">{c}</span>
                              <button type="button" className="text-gray-500 hover:text-red-600" onClick={() => setPColorsArr((prev) => prev.filter((x) => x !== c))}>×</button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-xs text-gray-500 mt-2">Puoi aggiungere fino a 20 colori. Usa il picker per selezionarli rapidamente.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Immagine</label>
                      <input
                        type="file"
                        accept=",.png"
                        className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setPFile(f);
                          if (f) {
                            const url = URL.createObjectURL(f);
                            setPPreview(url);
                            setShowCrop(true);
                          } else {
                            setPPreview(null);
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Formato ammesso: PNG. Max 50MB.</p>
                      {pPreview && (
                        <div className="mt-3">
                          <img src={pPreview} alt="Preview" className="h-28 w-28 object-cover rounded-xl border" />
                        </div>
                      )}
                      <Modal isOpen={showCrop} onOpenChange={handleOpenChange} backdrop="opaque">
                        <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
                          {(onClose) => (
                            <>
                              <ModalHeader className="flex flex-col gap-1">Ritaglia immagine</ModalHeader>
                              <ModalBody>
                                {pPreview ? (
                                  <div className="rounded-xl overflow-hidden bg-black" style={{ position: 'relative', height: 320 }}>
                                    <Cropper
                                      image={pPreview}
                                      crop={crop}
                                      zoom={zoom}
                                      aspect={1}
                                      onCropChange={setCrop}
                                      onZoomChange={setZoom}
                                      onCropComplete={handleCropComplete}
                                    />
                                  </div>
                                ) : null}
                                <div className="mt-2">
                                  <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-purple-600"
                                  />
                                </div>
                              </ModalBody>
                              <ModalFooter>
                                <Button
                                  variant="bordered"
                                  className="rounded-full border-red-300 text-red-700 hover:bg-red-50"
                                  onClick={() => { onClose(); setCroppedAreaPixels(null); setZoom(1); setCrop({ x: 0, y: 0 }); lastCropKeyRef.current = null; }}
                                >
                                  Annulla crop
                                </Button>
                                <Button
                                  className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
                                  onClick={() => { onClose(); }}
                                >
                                  Applica crop
                                </Button>
                              </ModalFooter>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                      {creating && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                    {createError && <div className="text-red-600 font-medium">{createError}</div>}
                    {createSuccess && <div className="text-green-600 font-medium">{createSuccess}</div>}
                    <div className="flex justify-end space-x-4">
                      <Button variant="bordered" className="rounded-full" disabled={creating}
                        onClick={() => {
                          setPName("");
                          setPCategory("Stickers");
                          setPPrice("");
                          setPStock("");
                          setPDescription("");
                          setPFile(null);
                          setPPreview(null);
                          setPStatus(true);
                          setPPersonalizable(false);
                          setPColorsArr([]);
                          setPNewColor("#000000");
                          setShowCrop(false);
                          setCroppedAreaPixels(null);
                          setZoom(1);
                          setCrop({ x: 0, y: 0 });
                          setUploadProgress(0);
                          setCreateError(null);
                          setCreateSuccess(null);
                        }}
                      >
                        Annulla
                      </Button>
                      <Button type="submit" isDisabled={creating} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
                        Crea Prodotto
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {editing && (
        <EditProductModal
          p={editing}
          imageVersion={imgVersionMap[editing.uuid] || 0}
          busy={updating}
          onClose={() => setEditing(null)}
          onUpdate={async (data) => {
            if (!editing) return;
            await updateField(editing.$id, data);
            setEditing((prev) => prev ? { ...prev, ...data } : prev);
          }}
          onUpdateImage={async (file: File, onProgress?: (n: number) => void) => {
            if (!editing || !dbId || !productsCol) return;
            // Validate PNG and size
            if (file.type !== 'image/png') return;
            if (file.size > 50 * 1024 * 1024) return;
            const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_STORAGE as string | undefined;
            if (!bucketId) return;
            try {
              // 1) Elimina il file corrente (se esiste)
              try { await storage.deleteFile(bucketId, editing.uuid); } catch {}
              // 2) Crea il nuovo file con lo stesso uuid
              const renamed = new File([file], `${editing.uuid}.png`, { type: 'image/png' });
              await storage.createFile({ bucketId, fileId: editing.uuid, file: renamed, onProgress: (p) => onProgress?.(Math.round(p.progress)) });
              // 3) Costruisci URL canonicale e attendi disponibilità
              const newUrl = storage.getFileView(bucketId, editing.uuid);
              await waitForImageReachable(newUrl);
              // 4) Aggiorna il documento
              await updateField(editing.$id, { img_url: newUrl });
              setEditing((prev) => prev ? { ...prev, img_url: newUrl } : prev);
              bumpImageVersion(editing.uuid);
            } catch {}
          }}
          onDelete={async () => { if (editing) await deleteProduct(editing); }}
        />
      )}
    </div>
  );
}

function EditProductModal({ p, imageVersion, onClose, onUpdate, onUpdateImage, onDelete, busy }: { p: any; imageVersion: number; onClose: () => void; onUpdate: (data: any) => Promise<void>; onUpdateImage: (file: File, onProgress?: (n: number) => void) => Promise<void>; onDelete: () => Promise<void>; busy: boolean }) {
  const [name, setName] = useState(p?.name || "");
  const [category, setCategory] = useState(p?.category || "");
  const [price, setPrice] = useState(p?.price || "");
  const [stock, setStock] = useState<number>(p?.stock || 0);
  const [description, setDescription] = useState(p?.description || "");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<boolean>(!!p?.status);
  const [personalizable, setPersonalizable] = useState<boolean>(!!p?.personalizable);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [colors, setColors] = useState<string[]>(Array.isArray(p?.colors) ? p.colors : []);
  const [newColor, setNewColor] = useState<string>("#000000");

  async function getCroppedBlob(imageSrc: string, cropPx: { x: number; y: number; width: number; height: number } | null): Promise<Blob> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = imageSrc;
    });
    const area = cropPx ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight } as const;
    const canvas = document.createElement('canvas');
    canvas.width = area.width;
    canvas.height = area.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non disponibile');
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
    const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/png', 0.92));
    return blob;
  }

  return (
    <Modal isOpen={!!p} onOpenChange={(o) => { if (!o) onClose(); }} backdrop="opaque" placement="center">
      <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-2">
              <Button isIconOnly variant="light" className="rounded-full text-gray-600 hover:text-red-600" onClick={onClose} aria-label="Chiudi">
                <X size={18} />
              </Button>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Modifica prodotto</h3>
              <span className="w-8" />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <img src={p?.img_url} alt={p?.name} className="w-16 h-16 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aggiorna immagine (PNG, max 50MB)</label>
                    <input type="file" accept=",.png" className="text-gray-900" onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setImgFile(f);
                      const url = f ? URL.createObjectURL(f) : null;
                      setImgPreview(url);
                      if (f && url) setCropOpen(true);
                    }} />
                    {imgPreview ? <img src={imgPreview} alt="preview" className="mt-2 w-20 h-20 object-cover rounded border" /> : null}
                  </div>
                  <Button size="sm" isDisabled={busy || !imgFile} onClick={async () => {
                    if (!imgFile) return;
                    try {
                      setUploadProgress(0);
                      // Se è stata fatta un'area di crop, genera PNG ritagliato
                      const blob = await getCroppedBlob(imgPreview || URL.createObjectURL(imgFile), croppedAreaPixels);
                      const finalFile = new File([blob], `${p.uuid}.png`, { type: 'image/png' });
                      await onUpdateImage(finalFile, (n) => setUploadProgress(n));
                      setImgFile(null);
                      setImgPreview(null);
                    } catch {}
                  }} className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna immagine</Button>
                </div>
                {busy && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Stato</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={status} onChange={(e) => setStatus(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                      <span className="ml-3 text-sm text-gray-700">{status ? 'Attivo' : 'Disabilitato'}</span>
                    </label>
                  </div>
                  <Button isDisabled={busy || status === !!p?.status} onClick={() => onUpdate({ status })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Personalizzabile</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={personalizable} onChange={(e) => setPersonalizable(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                      <span className="ml-3 text-sm text-gray-700">{personalizable ? 'Sì' : 'No'}</span>
                    </label>
                  </div>
                  <Button isDisabled={busy || personalizable === !!p?.personalizable} onClick={() => onUpdate({ personalizable })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colori (opzionale)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-14 rounded-lg border border-gray-300 bg-white" />
                    <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white" onClick={() => {
                      const c = (newColor || "").trim();
                      if (!c) return;
                      if (colors.includes(c)) return;
                      setColors((prev) => [...prev, c].slice(0, 20));
                    }}>Aggiungi colore</Button>
                    <Button isDisabled={busy} onClick={() => onUpdate({ colors })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                  </div>
                  {colors.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {colors.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: '#e5e7eb' }}>
                          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }} />
                          <span className="text-sm text-gray-700">{c}</span>
                          <button type="button" className="text-gray-500 hover:text-red-600" onClick={() => setColors((prev) => prev.filter((x) => x !== c))}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-xs text-gray-500">Puoi aggiungere fino a 20 colori. Usa il picker per selezionarli rapidamente.</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <Button isDisabled={busy || name === p?.name} onClick={() => onUpdate({ name: name.trim().slice(0,50) })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <input className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600" value={category} maxLength={50} onChange={(e) => setCategory(e.target.value)} />
                  </div>
                  <Button isDisabled={busy || category === p?.category} onClick={() => onUpdate({ category: category.trim().slice(0,50) })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo</label>
                    <input className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600" value={price} maxLength={150} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <Button isDisabled={busy || price === p?.price} onClick={() => onUpdate({ price: price.trim().slice(0,150) })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" onClick={() => setStock((s) => Math.max(0, s - 1))}>-</Button>
                      <input className="w-24 px-3 py-2 border border-gray-400 rounded-lg text-center focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600" type="number" min={0} value={stock} onChange={(e) => setStock(Math.max(0, Number(e.target.value)||0))} />
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" onClick={() => setStock((s) => s + 1)}>+</Button>
                    </div>
                  </div>
                  <Button isDisabled={busy || stock === p?.stock} onClick={() => onUpdate({ stock: Math.max(0, stock) })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                    <textarea className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600" rows={3} value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <Button isDisabled={busy || description === p?.description} onClick={() => onUpdate({ description: description.trim().slice(0,500) })} className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">Aggiorna</Button>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <Button className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6" onClick={onClose}>Chiudi</Button>
                  <Button color="danger" className="rounded-full bg-red-600 text-white hover:bg-red-700" isDisabled={busy}
                    onClick={() => setConfirmOpen(true)}>
                    Elimina prodotto
                  </Button>
                </div>
              </div>
            </ModalBody>
            <ModalFooter />

            {/* Crop modal for image update */}
            <Modal isOpen={cropOpen} onOpenChange={setCropOpen} backdrop="opaque" placement="center">
              <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
                {(onClose) => (
                  <>
                    <ModalHeader className="flex flex-col gap-1">Ritaglia immagine</ModalHeader>
                    <ModalBody>
                      {imgPreview ? (
                        <div className="rounded-xl overflow-hidden bg-black" style={{ position: 'relative', height: 320 }}>
                          <Cropper
                            image={imgPreview}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, area) => setCroppedAreaPixels(area as any)}
                          />
                        </div>
                      ) : null}
                      <div className="mt-2">
                        <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-purple-600" />
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button variant="bordered" className="rounded-full border-red-300 text-red-700 hover:bg-red-50" onClick={() => { onClose(); setCroppedAreaPixels(null); setZoom(1); setCrop({ x: 0, y: 0 }); }}>Annulla</Button>
                      <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" onClick={async () => {
                        if (!imgPreview) { onClose(); return; }
                        try {
                          const blob = await getCroppedBlob(imgPreview, croppedAreaPixels);
                          const finalFile = new File([blob], `${p.uuid}.png`, { type: 'image/png' });
                          await onUpdateImage(finalFile, (n) => setUploadProgress(n));
                          setImgFile(null);
                          setImgPreview(null);
                          setCroppedAreaPixels(null);
                          setZoom(1);
                          setCrop({ x: 0, y: 0 });
                        } catch {}
                        // non chiudere il modal di edit; possiamo chiudere solo il crop
                        onClose();
                      }}>Aggiorna immagine</Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>

            {/* Confirm delete modal */}
            <Modal isOpen={confirmOpen} onOpenChange={setConfirmOpen} backdrop="opaque" placement="center">
              <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
                {(onClose) => (
                  <>
                    <ModalHeader className="flex flex-col gap-1">Eliminare il prodotto?</ModalHeader>
                    <ModalBody>
                      <p className="text-gray-700">Questa azione eliminerà definitivamente il prodotto e l'immagine associata. L'operazione non può essere annullata.</p>
                    </ModalBody>
                    <ModalFooter>
                      <Button className="rounded-full" onClick={onClose}>Annulla</Button>
                      <Button color="danger" className="rounded-full bg-red-600 text-white hover:bg-red-700" isDisabled={busy} onClick={async () => { await onDelete(); onClose(); }}>Elimina</Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
