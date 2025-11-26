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
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download
} from "lucide-react";
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { supabase, PRODUCTS_DB, PRODUCTS_STORAGE, CATEGORIES_DB, ORDERS_DB, USER_COLLECTION, generateId } from "../components/auth/supabaseClient";
import Cropper from "react-easy-crop";

// Ordini dinamici da Appwrite
type OrderItemDoc = {
  name?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  unit_price?: number | string;
  uuid?: string;
  personalized?: string;
  color?: string;
};
type OrderDoc = {
  $id: string;
  $createdAt?: string;
  id?: string;
  orderId?: string;
  customer?: string;
  customerName?: string;
  name?: string;
  email?: string;
  customerEmail?: string;
  status?: string;
  speditionInfo?: string;
  total?: number | string;
  currency?: string;
  items?: OrderItemDoc[] | unknown[];
  cartItems?: OrderItemDoc[] | unknown[];
  products?: OrderItemDoc[] | unknown[];
  userUuid?: string;
  bill?: number | string;
};

// Products types
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
  sizes?: string[];
};

// (rimosso mockProducts)

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'create' | 'categories'>('orders');
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSeries, setUsersSeries] = useState<Array<{ date: string; count: number }>>([]);
  const [usersGrowth, setUsersGrowth] = useState<number | null>(null);
  // removed duplicate declaration
  // removed duplicate declaration
  const [ordersGrowth, setOrdersGrowth] = useState<number | null>(null);
  // removed duplicate declaration
  // removed duplicate declaration
  const [revenueGrowth, setRevenueGrowth] = useState<number | null>(null);
  const [ordersTotalAll, setOrdersTotalAll] = useState(0);
  const [ordersSeries, setOrdersSeries] = useState<Array<{ date: string; value: number }>>([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenueSeries, setRevenueSeries] = useState<Array<{ date: string; value: number }>>([]);
  // Fallback to avoid infinite loading screen if auth hangs
  const [authReady, setAuthReady] = useState(false);
  // Orders state
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | null>('pagato');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [statusMenuFor, setStatusMenuFor] = useState<string | null>(null);

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
  const [pSizesArr, setPSizesArr] = useState<string[]>([]);
  const [pNewSize, setPNewSize] = useState<string>("");
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const lastCropKeyRef = useRef<string | null>(null);
  // Products state
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsSearch, setProductsSearch] = useState("");
  const [imgVersionMap, setImgVersionMap] = useState<Record<string, number>>({});

  function bumpImageVersion(uuid: string) {
    setImgVersionMap((prev) => ({ ...prev, [uuid]: (prev[uuid] || 0) + 1 }));
  }

  // Non più necessario con Supabase - le costanti sono già esportate da supabaseClient
  // const dbId, productsCol, etc. non servono più

  const formatEuro = (amount: number | string | undefined) => {
    const n = typeof amount === 'string' ? Number(amount.replace(/[^0-9.-]/g, '')) : Number(amount);
    if (!Number.isFinite(n)) return String(amount ?? '');
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n / (n > 1000 ? 100 : 1));
  };

  // Input style aligned with shipping-info page
  const searchInputBase = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 font-semibold outline-none";

  // Admin order statuses and helpers
  const adminOrderStatuses = ['pagato', 'elaborazione', 'spedito', 'archiviato'] as const;
  type AdminOrderStatus = (typeof adminOrderStatuses)[number];
  // nextAdminStatus removed (unused)
  const statusPillClass = (s: string) => {
    const st = String(s || '').toLowerCase();
    if (st === 'pagato') return 'bg-green-100 text-green-700';
    if (st === 'elaborazione') return 'bg-yellow-100 text-yellow-700';
    if (st === 'spedito') return 'bg-blue-100 text-blue-700';
    if (st === 'archiviato') return 'bg-gray-200 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Shipping modal for tracking number when switching to 'spedito' or editing tracking
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);
  const [shipDocId, setShipDocId] = useState<string | null>(null);
  const [shipInfo, setShipInfo] = useState<string>('');
  const [shipSaving, setShipSaving] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [shipEditOnly, setShipEditOnly] = useState<boolean>(false);

  async function openShipModalFor(docId: string, orderId: string, editOnly = false) {
    setShipDocId(docId);
    setShipOrderId(orderId);
    setShipEditOnly(editOnly);
    setShipInfo('');
    setShipError(null);
    setShipSaving(false);
    setShipModalOpen(true);
    try {
      const res = await fetch(`/api/admin/orders?supabaseId=${encodeURIComponent(docId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const current = data?.order?.spedition_info as string | undefined;
        if (typeof current === 'string' && current.trim()) {
          const raw = current.trim();
          const parsed = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : raw;
          setShipInfo(parsed);
        }
      }
    } catch {}
  }

  async function saveShipInfoAndMarkShipped() {
    if (!shipDocId || !shipOrderId) return;
    const val = String(shipInfo || '').trim();
    if (!val) { setShipError('Inserire il numero di tracking'); return; }
    setShipSaving(true);
    setShipError(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseId: shipDocId, order_uuid: shipOrderId, spedition_info: `DHL Tracking Number: ${val}`, ...(shipEditOnly ? {} : { status: 'spedito' }) })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchOrders();
      setShipModalOpen(false);
    } catch (e) {
      const msg = (e && typeof (e as { message?: unknown }).message === 'string') ? String((e as { message?: unknown }).message) : 'Errore imprevisto';
      setShipError(msg);
    } finally {
      setShipSaving(false);
    }
  }

  async function updateOrderStatus(orderDocId: string, newStatus: AdminOrderStatus) {
    if (!orderDocId) return;
    setUpdatingStatus((m) => ({ ...m, [orderDocId]: true }));
    const prev = orders;
    // optimistic UI
    setOrders((list) => {
      const nextList = Array.isArray(list)
        ? list.map((o) =>
            o && o.$id === orderDocId
              ? { ...o, status: newStatus, ...(String(newStatus).toLowerCase() !== 'spedito' ? { speditionInfo: '' } : {}) }
              : o
          )
        : [];
      // If a filter is active and the updated order no longer matches it, remove it immediately
      if (statusFilter && String(newStatus) !== statusFilter) {
        return nextList.filter((o) => o.$id !== orderDocId);
      }
      return nextList;
    });
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (String(newStatus).toLowerCase() !== 'spedito') payload.spedition_info = null;
      
      const { error } = await supabase
        .from(ORDERS_DB)
        .update(payload)
        .eq('id', orderDocId);
      
      if (error) throw error;
      
      // Re-fetch to ensure lists/metrics reflect filters and aggregates
      await fetchOrders();
    } catch (e) {
      console.error('Error updating order status:', e);
      // revert
      setOrders(prev);
    } finally {
      setUpdatingStatus((m) => ({ ...m, [orderDocId]: false }));
    }
  }

  // User modal (shipping info)
  type UserInfo = {
    name_surname?: string;
    phone_number?: string;
    street_address?: string;
    apartment_number?: string;
    nation?: string;
    state?: string;
    postal_code?: string;
  };
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userModalData, setUserModalData] = useState<UserInfo | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // Personalization modal
  const [persModalOpen, setPersModalOpen] = useState(false);
  const [persModal, setPersModal] = useState<{ type: 'image' | 'text'; value: string } | null>(null);
  async function copyValue(label: string, value?: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey((k) => (k === label ? null : k)), 800);
    } catch {}
  }
  function openPersonalization(personal: string) {
    const isImg = personal.startsWith('/api/media/products/');
    setPersModal({ type: isImg ? 'image' : 'text', value: personal });
    setPersModalOpen(true);
  }

  async function openUserModalByUuid(userUuid?: string) {
    setUserModalOpen(true);
    setUserModalLoading(true);
    setUserModalError(null);
    setUserModalData(null);
    try {
      if (!userUuid) {
        setUserModalError('Dati utente non disponibili');
        return;
      }
      
      const { data: doc, error } = await supabase
        .from(USER_COLLECTION)
        .select('*')
        .eq('uuid', userUuid)
        .maybeSingle();
      
      if (error || !doc) {
        setUserModalError('Utente non trovato');
        return;
      }
      const data: UserInfo = {
        name_surname: String(doc.name_surname ?? ''),
        phone_number: String(doc.phone_number ?? ''),
        street_address: String(doc.street_address ?? ''),
        apartment_number: String(doc.apartment_number ?? ''),
        nation: String(doc.nation ?? ''),
        state: String(doc.state ?? ''),
        postal_code: String(doc.postal_code ?? ''),
      };
      setUserModalData(data);
    } catch {
      setUserModalError('Impossibile caricare i dati utente');
    } finally {
      setUserModalLoading(false);
    }
  }

  // Close status menu on outside click
  useEffect(() => {
    if (!statusMenuFor) return;
    const onDocClick = () => setStatusMenuFor(null);
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [statusMenuFor]);

  type UnknownRecord = Record<string, unknown>;
  type AppwriteDocument = { $id: string; $createdAt?: string } & UnknownRecord;
  type DocumentList<T> = { total: number; documents: T[] };

  const getFirstString = useCallback((o: UnknownRecord, keys: string[]): string => {
    for (const k of keys) {
      const v = o[k];
      if (typeof v === 'string') return v;
    }
    return '';
  }, []);
  const getFirstNumber = useCallback((o: UnknownRecord, keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = o[k];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
    }
    return undefined;
  }, []);
  const getFirstArray = useCallback((o: UnknownRecord, keys: string[]): UnknownRecord[] => {
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v as UnknownRecord[];
      if (typeof v === 'string') {
        const s = v.trim();
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed as UnknownRecord[];
        } catch {}
        // Try wrapping if string is a comma-separated objects without brackets
        if ((s.startsWith('{') && s.endsWith('}')) || s.includes('},{')) {
          try {
            const wrapped = `[${s}]`;
            const parsed2 = JSON.parse(wrapped);
            if (Array.isArray(parsed2)) return parsed2 as UnknownRecord[];
          } catch {}
        }
      }
    }
    return [];
  }, []);

  const mapOrderDoc = useCallback((d: UnknownRecord): OrderDoc => {
    const id = getFirstString(d, ['orderId', 'id', '$id']).slice(0, 50);
    const customer = getFirstString(d, ['customerName', 'customer', 'name']).slice(0, 120);
    const email = getFirstString(d, ['customerEmail', 'email']).slice(0, 200);
    const itemsArr = getFirstArray(d, ['items', 'cartItems', 'products', 'selected_products']);
    // Normalize array elements: parse string entries to objects when needed
    const normalizedItems: UnknownRecord[] = itemsArr.map((it: unknown) => {
      if (it && typeof it === 'object') return it as UnknownRecord;
      if (typeof it === 'string') {
        const s = it.trim();
        try {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object') return parsed as UnknownRecord;
        } catch {}
        if ((s.startsWith('{') && s.endsWith('}')) || s.includes('},{')) {
          try {
            const wrapped = `[${s}]`;
            const parsed2 = JSON.parse(wrapped);
            if (Array.isArray(parsed2) && parsed2[0] && typeof parsed2[0] === 'object') return parsed2[0] as UnknownRecord;
          } catch {}
        }
      }
      return {} as UnknownRecord;
    });
    // Parse bill (can be number or string)
    let billVal: number | string | undefined;
    const billNum = getFirstNumber(d, ['bill']);
    if (typeof billNum === 'number') {
      billVal = billNum;
    } else {
      const billStr = getFirstString(d, ['bill']);
      if (billStr) billVal = billStr;
    }

    return {
      $id: String(d.$id || ''),
      $createdAt: typeof d.$createdAt === 'string' ? d.$createdAt : undefined,
      orderId: (getFirstString(d, ['order_uuid', 'order_id', 'orderCode']) || id),
      customerName: customer,
      customerEmail: email,
      userUuid: getFirstString(d, ['user_uuid', 'userUuid', 'userId', 'uid']),
      status: getFirstString(d, ['status']).toLowerCase(),
      speditionInfo: getFirstString(d, ['spedition_info', 'speditionInfo']),
      total: ((): number | string => {
        const num = getFirstNumber(d, ['total', 'amountTotal', 'amount', 'priceTotal']);
        if (typeof num === 'number') return num;
        const str = getFirstString(d, ['total']);
        return str || '';
      })(),
      currency: getFirstString(d, ['currency']) || 'EUR',
      bill: billVal,
      items: normalizedItems.map((r: UnknownRecord) => {
        const name = getFirstString(r, ['name', 'title', 'productName']);
        const sku = getFirstString(r, ['sku']) || undefined;
        const quantity = getFirstNumber(r, ['quantity', 'qty']) ?? 1;
        const unitPrice = getFirstNumber(r, ['unitPrice', 'unit_price', 'price', 'unit_amount', 'unitAmount']) ?? 0;
        const unit_price = getFirstNumber(r, ['unit_price', 'unitPrice', 'price']) ?? undefined;
        const uuid = getFirstString(r, ['uuid']) || undefined;
        const personalized = getFirstString(r, ['personalized']) || undefined;
        const color = getFirstString(r, ['color']) || undefined;
        return { name, sku, quantity, unitPrice, unit_price, uuid, personalized, color } as OrderItemDoc;
      }),
    } as OrderDoc;
  }, [getFirstArray, getFirstNumber, getFirstString]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      // Fetch orders from Supabase
      const { data: list, error: ordersError } = await supabase
        .from(ORDERS_DB)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('[admin/orders] Error fetching orders:', ordersError);
        setOrdersError('Errore caricamento ordini');
        setOrdersLoading(false);
        return;
      }
      
      console.log('[admin/orders] raw documents from Supabase:', list);
      const mapped = (list || []).map((d) => mapOrderDoc(d as UnknownRecord));
      console.log('[admin/orders] mapped orders:', mapped);
      
      // Enrich names from products by uuid
      if (mapped.length > 0) {
        const uuids = new Set<string>();
        for (const o of mapped) {
          for (const it of o.items || []) {
            if (
              typeof it === 'object' &&
              it !== null &&
              'uuid' in it &&
              typeof (it as { uuid?: unknown }).uuid === 'string' &&
              (it as { uuid: string }).uuid
            ) {
              uuids.add((it as { uuid: string }).uuid);
            }
          }
        }
        if (uuids.size > 0) {
          try {
            const { data: productsData, error: productsError } = await supabase
              .from(PRODUCTS_DB)
              .select('uuid, name')
              .in('uuid', Array.from(uuids))
              .limit(200);
            
            if (!productsError && productsData) {
              const productByUuid: Record<string, { name?: unknown }> = {};
              for (const d of productsData) {
                const k = typeof d.uuid === 'string' ? d.uuid : '';
                if (k) productByUuid[k] = { name: d.name };
              }
              for (const o of mapped) {
                const itemsArr = Array.isArray(o.items) ? o.items : [];
                o.items = itemsArr.map((raw) => {
                  const it = raw && typeof raw === 'object' ? (raw as OrderItemDoc) : ({} as OrderItemDoc);
                  const uuid = typeof it.uuid === 'string' ? it.uuid : '';
                  const enrichedName = uuid && typeof productByUuid[uuid]?.name === 'string' ? String(productByUuid[uuid]?.name) : '';
                  return { ...it, name: it.name || (uuid ? enrichedName : it.name) } as OrderItemDoc;
                });
              }
              console.log('[admin/orders] enriched product names for uuids:', Array.from(uuids));
            }
          } catch (e) {
            console.error('[admin/orders] Error enriching product names:', e);
          }
        }
      }
      
      // Enrich user email from Auth using userUuid - For Supabase we can query auth directly
      // For now, we skip this as it requires service role key in client
      // Alternative: add email to orders table when creating order
      
      // Auto-archive: orders shipped over 2 months ago -> archiviato
      try {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 2);
        const toArchive = mapped.filter((o) => String(o.status || '').toLowerCase() === 'spedito' && o.$createdAt && new Date(o.$createdAt) < cutoff);
        if (toArchive.length) {
          await Promise.all(toArchive.map(async (o) => {
            try {
              const { error } = await supabase
                .from(ORDERS_DB)
                .update({ status: 'archiviato', spedition_info: null })
                .eq('id', o.$id);
              
              if (!error) {
                o.status = 'archiviato';
                o.speditionInfo = '' as unknown as string;
              }
            } catch (e) {
              console.error('Error archiving order:', e);
            }
          }));
        }
      } catch (e) {
        console.error('Error in auto-archive:', e);
      }

      // Build metrics: last 30 days like UsersChart (fill zeros for missing days)
      const now = new Date();
      const mkKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dayKeys: string[] = [];
      const dayOrderCount: Record<string, number> = {};
      const dayRevenue: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const k = mkKey(d);
        dayKeys.push(k);
        dayOrderCount[k] = 0;
        dayRevenue[k] = 0;
      }
      let totalOrders = 0;
      let totalRevenue = 0;
      for (const o of mapped) {
        totalOrders += 1;
        const b = typeof o.bill === 'number' ? o.bill : parseFloat(String(o.bill ?? '').replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (Number.isFinite(b)) totalRevenue += Number(b);
        const k = o.$createdAt ? o.$createdAt.slice(0, 10) : '';
        if (k && (k in dayOrderCount)) {
          dayOrderCount[k] += 1;
          if (Number.isFinite(b)) dayRevenue[k] += Number(b);
        }
      }
      // Compute growth (last 30 vs previous 30)
      const keys = dayKeys;
      const last30Orders = keys.map(k => dayOrderCount[k]);
      const last30Revenue = keys.map(k => dayRevenue[k]);
      const sum = (arr: number[]) => arr.reduce((a,b)=>a+b,0);
      // Build previous 30-day window from mapped data
      const prevDayOrderCount: Record<string, number> = {};
      const prevDayRevenue: Record<string, number> = {};
      const startPrev = new Date(keys[0]);
      for (let i = 30; i <= 59; i++) {
        const d = new Date(startPrev);
        d.setDate(d.getDate() - (60 - i));
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        prevDayOrderCount[k] = 0; prevDayRevenue[k] = 0;
      }
      for (const o of mapped) {
        const k = o.$createdAt ? o.$createdAt.slice(0,10) : '';
        if (k in prevDayOrderCount) {
          prevDayOrderCount[k] += 1;
          const b = typeof o.bill === 'number' ? o.bill : parseFloat(String(o.bill ?? '').replace(/[^0-9.,]/g,'').replace(',','.'));
          if (Number.isFinite(b)) prevDayRevenue[k] += Number(b);
        }
      }
      const prevKeys = Object.keys(prevDayOrderCount).sort();
      const prev30Orders = prevKeys.map(k => prevDayOrderCount[k]);
      const prev30Revenue = prevKeys.map(k => prevDayRevenue[k]);
      const currOrdersSum = sum(last30Orders);
      const prevOrdersSum = sum(prev30Orders);
      const currRevenueSum = sum(last30Revenue);
      const prevRevenueSum = sum(prev30Revenue);
      const computeGrowth = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
      setOrdersGrowth(computeGrowth(currOrdersSum, prevOrdersSum));
      setRevenueGrowth(computeGrowth(currRevenueSum, prevRevenueSum));

      setOrdersTotalAll(totalOrders);
      setRevenueTotal(totalRevenue);
      setOrdersSeries(dayKeys.map((k) => ({ date: k, value: dayOrderCount[k] })));
      setRevenueSeries(dayKeys.map((k) => ({ date: k, value: dayRevenue[k] })));

      const q = ordersSearch.trim().toLowerCase();
      let filtered = mapped;
      if (q) {
        filtered = filtered.filter((o) => {
          const hay = [o.orderId, o.customerName, o.customerEmail, o.status, ...(o.items || []).map((i) => (i as OrderItemDoc).name || '')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
      }
      if (statusFilter) {
        filtered = filtered.filter((o) => String(o.status || '').toLowerCase() === statusFilter);
      }
      filtered.sort((a, b) => (a.$createdAt || '').localeCompare(b.$createdAt || ''));
      setOrders(filtered.reverse());
    } catch {
      setOrdersError('Impossibile caricare gli ordini');
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersSearch, statusFilter, mapOrderDoc]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const { data: list, error } = await supabase
        .from(PRODUCTS_DB)
        .select('*');
      
      if (error) {
        console.error('Error fetching products:', error);
        setProductsError("Impossibile caricare i prodotti");
        return;
      }
      
      const mapped: ProductDoc[] = (list || []).map((d) => ({
        $id: String(d.id),
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
        sizes: Array.isArray(d.sizes) ? d.sizes.map((s: any) => String(s)) : [],
      }));
      setProducts(mapped);
    } catch (e) {
      console.error('fetchProducts error:', e);
      setProductsError("Impossibile caricare i prodotti");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Categories state and CRUD
  type Category = { $id: string; name: string };
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryMsg, setCategoryMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { data: list, error } = await supabase
          .from(CATEGORIES_DB)
          .select('*');
        
        if (cancelled) return;
        
        if (error) {
          console.error('fetchCategories error', error);
          setCategoriesError("Impossibile caricare le categorie");
          return;
        }
        
        const mapped: Category[] = (list || []).map((d) => ({ $id: String(d.id), name: String(d.name ?? "") }));
        mapped.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(mapped);
      } catch (e) {
        console.error('fetchCategories error', e);
        if (!cancelled) setCategoriesError("Impossibile caricare le categorie");
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  async function addCategory() {
    const name = newCategory.trim().slice(0, 50);
    if (!name) return;
    try {
      const { error } = await supabase
        .from(CATEGORIES_DB)
        .insert({ name });
      
      if (error) {
        console.error('addCategory error', error);
        setCategoryMsg("Errore aggiunta categoria");
        return;
      }
      
      setNewCategory("");
      setCategoryMsg("Categoria aggiunta");
      
      // refresh categories
      try {
        const { data: list } = await supabase
          .from(CATEGORIES_DB)
          .select('*');
        
        const mapped: Category[] = (list || []).map((d) => ({ $id: String(d.id), name: String(d.name ?? "") }));
        mapped.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(mapped);
      } catch (e) { 
        console.error('refresh categories after add error', e); 
      }
      
      setPCategory(name);
    } catch (err) {
      console.error('addCategory error', err);
      setCategoryMsg("Errore aggiunta categoria");
    }
  }

  async function removeCategoryById(id: string, name: string) {
    try {
      const { error } = await supabase
        .from(CATEGORIES_DB)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('removeCategory error', error);
        return;
      }
      
      try {
        const { data: list } = await supabase
          .from(CATEGORIES_DB)
          .select('*');
        
        const mapped: Category[] = (list || []).map((d) => ({ $id: String(d.id), name: String(d.name ?? "") }));
        mapped.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(mapped);
      } catch (e) { 
        console.error("refresh categories after remove error", e); 
      }
      if (pCategory === name) setPCategory("");
      setCategoryMsg("Categoria rimossa");
    } catch (err) {
      console.error("removeCategory error", err);
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

  // Load orders initially and on search change (debounced)
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => { if (!cancelled) fetchOrders(); }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [fetchOrders, statusFilter, ordersSearch]);

  const productsFiltered = products.filter((p) =>
    !productsSearch ? true : p.name.toLowerCase().includes(productsSearch.toLowerCase())
  );

  async function toggleProductStatus(docId: string, next: boolean) {
    try {
      const { error } = await supabase
        .from(PRODUCTS_DB)
        .update({ status: next })
        .eq('id', docId);
      
      if (error) {
        console.error('Error toggling product status:', error);
        return;
      }
      
      setProducts((prev) => prev.map((p) => (p.$id === docId ? { ...p, status: next } : p)));
    } catch (e) {
      console.error('toggleProductStatus error:', e);
    }
  }

  // Editing modal
  const [editing, setEditing] = useState<ProductDoc | null>(null);
  const [updating, setUpdating] = useState(false);

  function openEdit(p: ProductDoc) {
    setEditing(p);
  }

  async function updateField(docId: string, data: Partial<ProductDoc>) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from(PRODUCTS_DB)
        .update(data)
        .eq('id', docId);
      
      if (error) {
        console.error('Error updating product:', error);
      } else {
        setProducts((prev) => prev.map((p) => (p.$id === docId ? { ...p, ...data } : p)));
      }
    } catch (e) {
      console.error('updateField error:', e);
    }
    setUpdating(false);
  }

  async function deleteProduct(doc: ProductDoc) {
    setUpdating(true);
    try {
      // Delete image from storage
      try { 
        await supabase.storage
          .from(PRODUCTS_STORAGE)
          .remove([doc.uuid]); 
      } catch (e) {
        console.error('Error deleting image:', e);
      }
      
      // Delete product from database
      const { error } = await supabase
        .from(PRODUCTS_DB)
        .delete()
        .eq('id', doc.$id);
      
      if (error) {
        console.error('Error deleting product:', error);
      } else {
        setProducts(prev => prev.filter(p => p.$id !== doc.$id));
        setEditing(null);
      }
    } catch (e) {
      console.error('deleteProduct error:', e);
    }
    setUpdating(false);
  }

  const handleOpenChange = useCallback((open: boolean) => {
    setShowCrop(prev => (prev === open ? prev : open));
  }, []);

  const handleCropComplete = useCallback((_: unknown, areaPixels: { width: number; height: number; x: number; y: number }) => {
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

  // Stop showing the full-screen loader after a grace period
  useEffect(() => {
    if (!loading) { setAuthReady(true); return; }
    const t = setTimeout(() => setAuthReady(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

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

  if (!authReady) {
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

// Render ShippingModal near the end of AdminDashboard component return

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
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Ordini Totali</p>
                <p className="text-2xl font-bold text-gray-900">{ordersTotalAll}</p>
                <p className={`text-sm ${Number(ordersGrowth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{ordersGrowth !== null ? `${ordersGrowth >= 0 ? '+' : ''}${(ordersGrowth ?? 0).toFixed(1)}%` : ''}</p>
                <div className="mt-2 h-12 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ordersSeries.map(s => ({ date: s.date.slice(5), value: s.value }))} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} formatter={(value: number) => [String(value), 'Ordini']} labelFormatter={(label: string) => `Giorno: ${label}`} />
                      <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#ordersGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Ricavi</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(revenueTotal)}</p>
                <p className={`text-sm ${Number(revenueGrowth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{revenueGrowth !== null ? `${revenueGrowth >= 0 ? '+' : ''}${(revenueGrowth ?? 0).toFixed(1)}%` : ''}</p>
                <div className="mt-2 h-12 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries.map(s => ({ date: s.date.slice(5), value: s.value }))} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} formatter={(value: number) => [formatEuro(value), 'Ricavi']} labelFormatter={(label: string) => `Giorno: ${label}`} />
                      <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#revenueGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
                { id: 'categories', label: 'Categorie', icon: Package },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'orders' | 'products' | 'create' | 'categories')}
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
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="relative w-80">
                    <Search size={16} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cerca per ID, cliente, email, articolo..."
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      className={searchInputBase + " pl-9"}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {(['pagato','elaborazione','spedito','archiviato'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`h-9 px-3 rounded-full text-sm font-medium border ${statusFilter === s ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => setStatusFilter(prev => prev === s ? null : s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {ordersLoading ? <span className="text-sm text-gray-500">Caricamento...</span> : null}
                  {ordersError ? <span className="text-sm text-red-600">{ordersError}</span> : null}
                </div>
                <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                  {(!ordersLoading && !ordersError && orders.length === 0) && (
                    <div className="p-4 bg-gray-50 border rounded-xl text-center text-gray-500">Nessun ordine trovato</div>
                  )}
                  {orders.map((o: OrderDoc) => {
                    const id = o.orderId || o.$id;
                    const items: OrderItemDoc[] = Array.isArray(o.items) ? (o.items as OrderItemDoc[]) : [];
                    // const preview = items[0]?.name || '-';
                    // const more = Math.max((items.length || 0) - 1, 0);
                    // compute total from items if total field missing or empty
                    let computedTotal = 0;
                    for (const it of items) {
                      const qty = Number(it.quantity ?? 1);
                      const unit = Number(it.unitPrice ?? (it as unknown as { unit_price?: number }).unit_price ?? it.price ?? 0);
                      computedTotal += qty * unit;
                    }
                    const expanded = expandedOrderId === id;
                    const totalStr = typeof o.total === 'number' && o.total > 0 ? formatEuro(o.total) : formatEuro(computedTotal);
                    const status = String(o.status || '').toLowerCase();
                    const pillClass = statusPillClass(status);
                    return (
                      <div key={id} className="bg-white rounded-xl border shadow-sm">
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrderId(expanded ? null : id)}>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                            <div>
                              <p className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                                <span><span className="text-gray-500">ORD-</span>{id}</span>
                                {typeof o.speditionInfo === 'string' && o.speditionInfo.trim() ? (
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    title="Modifica tracking"
                                    onClick={(e) => { e.stopPropagation(); openShipModalFor(o.$id, id, true); }}
                                  >
                                    {o.speditionInfo}
                                  </button>
                                ) : null}
                                {o.customerEmail ? (
                                  <button
                                    type="button"
                                    className="text-xs text-purple-700 hover:underline"
                                    onClick={(e) => { e.stopPropagation(); openUserModalByUuid(o.userUuid); }}
                                    title="Vedi info spedizione"
                                  >
                                    {o.customerEmail}
                                  </button>
                                ) : null}
                              </p>
                              {(o.customerName || o.customer || o.name) ? (
                                <p className="text-sm text-gray-600">{o.customerName || o.customer || o.name}</p>
                              ) : null}
                              <p className="text-xs text-gray-500">{new Date(o.$createdAt || Date.now()).toLocaleString('it-IT')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${pillClass} ${updatingStatus[o.$id] ? 'opacity-60' : 'hover:opacity-90'} cursor-pointer`}
                                onClick={() => setStatusMenuFor(prev => prev === o.$id ? null : o.$id)}
                                disabled={!!updatingStatus[o.$id]}
                                title="Modifica stato ordine"
                              >
                                {status || '—'}
                              </button>
                              {statusMenuFor === o.$id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50" role="menu" aria-label="Seleziona stato">
                                  {adminOrderStatuses.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      className={`w-full text-left px-3 py-2 text-sm ${s === status ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'} text-gray-800`}
                                      onClick={async () => {
                                        setStatusMenuFor(null);
                                        if (s === 'spedito') {
                                          await openShipModalFor(o.$id, o.orderId || o.$id, false);
                                        } else {
                                          await updateOrderStatus(o.$id, s);
                                        }
                                      }}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">{totalStr}</span>
                          </div>
                        </div>
                        {expanded && (
                          <div className="px-4 pb-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Prodotti acquistati</h4>
                              <div className="divide-y divide-gray-100">
                                {items.map((it: OrderItemDoc, idx: number) => {
                                  const qty = Number(it.quantity ?? 1);
                                  const unit = Number(it.unitPrice ?? it.unit_price ?? it.price ?? 0);
                                  const personal = it.personalized ? String(it.personalized) : '';
                                  const isImg = personal.startsWith('/api/media/products/');
                                  const imgSrc = it.uuid ? `/api/media/products/${String(it.uuid)}` : '';
                                  return (
                                    <div key={idx} className="py-3 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc || `/api/media/products/${it.uuid}`} alt={it.uuid || 'item'} className="w-12 h-12 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                                        <div className="text-sm text-gray-700">
                                          <div className="font-medium text-gray-900">{it.name || `Prodotto ${it.uuid}`}</div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {personal ? (
                                              <button type="button" className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs hover:bg-purple-100"
                                                onClick={(e) => { e.stopPropagation(); openPersonalization(personal); }} title="Vedi personalizzazione">
                                                Articolo personalizzato · {isImg ? 'immagine' : 'testuale'}
                                              </button>
                                            ) : null}
                                            {it.color ? <span className="inline-flex items-center gap-1 text-xs text-gray-700">Colore <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: it.color }} /></span> : null}
                                            {unit ? <span className="text-xs text-gray-700">Prezzo: {formatEuro(unit)}</span> : null}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-900">x{qty}</div>
                                        {unit ? (
                                          <div className="text-xs text-gray-600">Tot: {formatEuro(qty * unit)}</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    setCreating(true);
                    try {
                      // Genera UUID per prodotto (usato anche come fileId)
                      const uuid = generateId();
                      // Colors opzionali
                      const colorsArr = pColorsArr.map(c => c.slice(0, 20));
                      // Sizes opzionali
                      const sizesArr = pSizesArr.map(s => s.slice(0, 10));
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
                      
                      // Upload to Supabase Storage
                      const { error: uploadError } = await supabase.storage
                        .from(PRODUCTS_STORAGE)
                        .upload(uuid, uploadFile, {
                          upsert: false,
                        });
                      
                      if (uploadError) {
                        console.error('Upload error:', uploadError);
                        setCreateError(`Errore upload immagine: ${uploadError.message}`);
                        setCreating(false);
                        return;
                      }
                      
                      setUploadProgress(100);
                      
                      // URL immagine
                      const img_url = `/api/media/products/${uuid}`;
                      
                      // Crea documento prodotto
                      const { error: createError } = await supabase
                        .from(PRODUCTS_DB)
                        .insert({
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
                          sizes: sizesArr,
                        });
                      
                      if (createError) {
                        console.error('Create product error:', createError);
                        setCreateError(`Errore creazione prodotto: ${createError.message}`);
                        setCreating(false);
                        return;
                      }
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
                      setPSizesArr([]);
                      setPNewSize("");
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taglie (opzionale)</label>
                      <div className="space-y-3">
                        {/* Taglie predefinite */}
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Taglie standard:</p>
                          <div className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                              <button
                                key={size}
                                type="button"
                                className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                                  pSizesArr.includes(size)
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                                }`}
                                onClick={() => {
                                  if (pSizesArr.includes(size)) {
                                    setPSizesArr((prev) => prev.filter((s) => s !== size));
                                  } else {
                                    setPSizesArr((prev) => [...prev, size]);
                                  }
                                }}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Taglie numeriche personalizzate */}
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Aggiungi numeri (es. 38, 40, 42):</p>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={pNewSize}
                              onChange={(e) => setPNewSize(e.target.value)}
                              placeholder="Es. 38"
                              className="h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 w-24"
                              maxLength={10}
                            />
                            <Button
                              type="button"
                              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                              onClick={() => {
                                const s = pNewSize.trim();
                                if (!s) return;
                                if (pSizesArr.includes(s)) return;
                                setPSizesArr((prev) => [...prev, s]);
                                setPNewSize("");
                              }}
                            >
                              Aggiungi
                            </Button>
                          </div>
                        </div>
                        {/* Taglie aggiunte */}
                        {pSizesArr.length > 0 ? (
                          <div>
                            <p className="text-xs text-gray-600 mb-2">Taglie selezionate:</p>
                            <div className="flex flex-wrap gap-2">
                              {pSizesArr.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-50"
                                >
                                  <span className="text-sm font-medium text-gray-900">{s}</span>
                                  <button
                                    type="button"
                                    className="text-gray-500 hover:text-red-600 font-bold text-lg leading-none"
                                    onClick={() => setPSizesArr((prev) => prev.filter((x) => x !== s))}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Seleziona taglie standard e/o aggiungi numeri personalizzati.</p>
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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

            {activeTab === 'categories' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Categorie</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nuova categoria</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder:text-gray-600"
                        placeholder="Es. Tazze, Sticker, Abbigliamento"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        maxLength={50}
                      />
                      <Button type="button" className="h-11 px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" disabled={!newCategory.trim()} onClick={addCategory}>Aggiungi</Button>
                    </div>
                    {categoryMsg ? <p className="text-xs text-gray-500 mt-2">{categoryMsg}</p> : null}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c.$id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900">
                            {c.name}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="bordered" className="rounded-full border-red-300 text-red-700" onClick={() => removeCategoryById(c.$id, c.name)}>Rimuovi</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {editing && (
        <EditProductModal
          p={editing}
          busy={updating}
          onClose={() => setEditing(null)}
          onUpdate={async (data) => {
            if (!editing) return;
            await updateField(editing.$id, data);
            setEditing((prev) => prev ? { ...prev, ...data } : prev);
          }}
          onUpdateImage={async (file: File, onProgress?: (n: number) => void) => {
            if (!editing) return;
            // Validate PNG and size
            if (file.type !== 'image/png') return;
            if (file.size > 50 * 1024 * 1024) return;
            
            try {
              // 1) Elimina il file corrente (se esiste)
              try { 
                await supabase.storage
                  .from(PRODUCTS_STORAGE)
                  .remove([editing.uuid]); 
              } catch (e) {
                console.error('Error deleting old image:', e);
              }
              
              // 2) Carica il nuovo file con lo stesso uuid
              const renamed = new File([file], `${editing.uuid}.png`, { type: 'image/png' });
              const { error: uploadError } = await supabase.storage
                .from(PRODUCTS_STORAGE)
                .upload(editing.uuid, renamed, {
                  upsert: true,
                });
              
              if (uploadError) {
                console.error('Upload error:', uploadError);
                return;
              }
              
              if (onProgress) onProgress(100);
              
              // 3) Costruisci URL canonicale
              const newUrl = `/api/media/products/${editing.uuid}`;
              await waitForImageReachable(newUrl);
              
              // 4) Aggiorna il documento
              await updateField(editing.$id, { img_url: newUrl });
              setEditing((prev) => prev ? { ...prev, img_url: newUrl } : prev);
              bumpImageVersion(editing.uuid);
            } catch (e) {
              console.error('Error updating image:', e);
            }
          }}
          onDelete={async () => { if (editing) await deleteProduct(editing); }}
        />
      )}
      {/* User shipping info modal */}
      <Modal isOpen={userModalOpen} onOpenChange={setUserModalOpen} backdrop="opaque" placement="center">
        <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
          {() => (
            <>
              <ModalHeader className="flex items-center justify-between gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Informazioni utente</h3>
                <span className="w-8" />
              </ModalHeader>
              <ModalBody>
                {userModalLoading ? (
                  <div className="py-6 text-center text-gray-600">Caricamento…</div>
                ) : userModalError ? (
                  <div className="py-6 text-center text-red-600">{userModalError}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nome e cognome</label>
                      <div className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 font-semibold flex items-center justify-between">
                        <span>{userModalData?.name_surname || '—'}</span>
                        {userModalData?.name_surname ? (
                          <button className="text-gray-600 hover:text-gray-900" title="Copia" onClick={() => copyValue('name_surname', userModalData?.name_surname)}>
                            {copiedKey === 'name_surname' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Telefono</label>
                      <div className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 font-semibold flex items-center justify-between">
                        <span>{userModalData?.phone_number || '—'}</span>
                        {userModalData?.phone_number ? (
                          <button className="text-gray-600 hover:text-gray-900" title="Copia" onClick={() => copyValue('phone', userModalData?.phone_number)}>
                            {copiedKey === 'phone' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Indirizzo</label>
                      <div className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 font-semibold flex items-center justify-between">
                        <span>{userModalData?.street_address || '—'}{userModalData?.apartment_number ? `, ${userModalData?.apartment_number}` : ''}</span>
                        {userModalData?.street_address ? (
                          <button className="text-gray-600 hover:text-gray-900" title="Copia" onClick={() => copyValue('address', `${userModalData?.street_address}${userModalData?.apartment_number ? `, ${userModalData?.apartment_number}` : ''}`)}>
                            {copiedKey === 'address' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nazione</label>
                      <div className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 font-semibold flex items-center justify-between">
                        <span>{userModalData?.nation || '—'}</span>
                        {userModalData?.nation ? (
                          <button className="text-gray-600 hover:text-gray-900" title="Copia" onClick={() => copyValue('nation', userModalData?.nation)}>
                            {copiedKey === 'nation' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Regione/Stato</label>
                      <div className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 font-semibold flex items-center justify-between">
                        <span>{userModalData?.state || '—'}</span>
                        {userModalData?.state ? (
                          <button className="text-gray-600 hover:text-gray-900" title="Copia" onClick={() => copyValue('state', userModalData?.state)}>
                            {copiedKey === 'state' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CAP</label>
                      <div className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 font-semibold flex items-center justify-between">
                        <span>{userModalData?.postal_code || '—'}</span>
                        {userModalData?.postal_code ? (
                          <button className="text-gray-600 hover:text-gray-900" title="Copia" onClick={() => copyValue('postal', userModalData?.postal_code)}>
                            {copiedKey === 'postal' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button className="rounded-full" onClick={() => setUserModalOpen(false)}>Chiudi</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Personalization modal */}
      <Modal isOpen={persModalOpen} onOpenChange={setPersModalOpen} backdrop="opaque" placement="center">
        <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
          {() => (
            <>
              <ModalHeader className="flex items-center justify-between gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Personalizzazione</h3>
                <span className="w-8" />
              </ModalHeader>
              <ModalBody>
                {!persModal ? null : (
                  persModal.type === 'image' ? (
                    <div className="space-y-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={persModal.value} alt="personalized" className="w-full max-h-96 object-contain rounded-xl border border-gray-300" />
                      <div className="flex justify-end">
                        <a href={persModal.value} download className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gray-900 text-white hover:bg-gray-800 font-semibold">
                          <Download size={16} /> Scarica immagine
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="px-3 py-3 border border-gray-300 rounded-xl text-gray-900 font-semibold bg-gray-50">{persModal.value}</div>
                      <div className="flex justify-end">
                        <Button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" onClick={() => navigator.clipboard.writeText(persModal.value)}>
                          <Copy size={16} /> Copia testo
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </ModalBody>
              <ModalFooter>
                <Button className="rounded-full" onClick={() => setPersModalOpen(false)}>Chiudi</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <ShippingModal
        open={shipModalOpen}
        info={shipInfo}
        setInfo={setShipInfo}
        saving={shipSaving}
        error={shipError}
        onClose={() => setShipModalOpen(false)}
        onSave={saveShipInfoAndMarkShipped}
        inputClassName={searchInputBase}
      />
    </div>
  );
}

function EditProductModal({ p, onClose, onUpdate, onUpdateImage, onDelete, busy }: { p: ProductDoc; onClose: () => void; onUpdate: (data: Partial<ProductDoc>) => Promise<void>; onUpdateImage: (file: File, onProgress?: (n: number) => void) => Promise<void>; onDelete: () => Promise<void>; busy: boolean }) {
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
  const [sizes, setSizes] = useState<string[]>(Array.isArray(p?.sizes) ? p.sizes : []);
  const [newSize, setNewSize] = useState<string>("");

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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taglie (opzionale)</label>
                  <div className="space-y-3">
                    {/* Taglie predefinite */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Taglie standard:</p>
                      <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`px-3 py-1 rounded-full border-2 text-sm font-medium transition-colors ${
                              sizes.includes(size)
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                            }`}
                            onClick={() => {
                              if (sizes.includes(size)) {
                                setSizes((prev) => prev.filter((s) => s !== size));
                              } else {
                                setSizes((prev) => [...prev, size]);
                              }
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Taglie numeriche personalizzate */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Aggiungi numeri:</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          placeholder="Es. 38"
                          className="h-9 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 text-gray-900 w-24"
                          maxLength={10}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          onClick={() => {
                            const s = newSize.trim();
                            if (!s) return;
                            if (sizes.includes(s)) return;
                            setSizes((prev) => [...prev, s]);
                            setNewSize("");
                          }}
                        >
                          Aggiungi
                        </Button>
                        <Button 
                          size="sm"
                          isDisabled={busy} 
                          onClick={() => onUpdate({ sizes })} 
                          className="h-9 px-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
                        >
                          Aggiorna taglie
                        </Button>
                      </div>
                    </div>
                    {/* Taglie aggiunte */}
                    {sizes.length > 0 ? (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Taglie selezionate:</p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-50"
                            >
                              <span className="text-sm font-medium text-gray-900">{s}</span>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-red-600 font-bold"
                                onClick={() => setSizes((prev) => prev.filter((x) => x !== s))}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500">Seleziona taglie standard e/o aggiungi numeri personalizzati.</p>
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
                            onCropComplete={(_, area) => setCroppedAreaPixels(area as unknown as { x: number; y: number; width: number; height: number })}
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
                      <p className="text-gray-700">Questa azione eliminerà definitivamente il prodotto e l&apos;immagine associata. L&apos;operazione non può essere annullata.</p>
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

// Shipping modal component injected near root return (uses same Modal import)
function ShippingModal({
  open,
  info,
  setInfo,
  saving,
  error,
  onClose,
  onSave,
  inputClassName,
}: {
  open: boolean;
  info: string;
  setInfo: (v: string) => void;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  inputClassName?: string;
}) {
  return (
    <Modal isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }} backdrop="opaque" placement="center">
      <ModalContent className="bg-white shadow-2xl border border-gray-200 rounded-2xl">
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Imposta spedizione</h3>
              <span className="w-8" />
            </ModalHeader>
            <ModalBody>
              <label className="block text-sm font-medium text-gray-700 mb-2">DHL Tracking Number</label>
              <input
                type="text"
                placeholder="Inserisci solo il numero DHL"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                className={inputClassName || "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 font-semibold outline-none"}
              />
              {error ? <p className="text-sm text-red-600 mt-1">{error}</p> : null}
            </ModalBody>
            <ModalFooter>
              <Button className="rounded-full" variant="bordered" onClick={onClose} isDisabled={saving}>Annulla</Button>
              <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white" onClick={onSave} isLoading={saving}>Salva e segna come spedito</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}