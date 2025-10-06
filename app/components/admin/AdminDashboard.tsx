'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Truck,
  MapPin
} from 'lucide-react';
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSeries, setUsersSeries] = useState<Array<{ date: string; count: number }>>([]);
  const [usersGrowth, setUsersGrowth] = useState<number | null>(null);

  type Address = {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    state?: string;
    country: string;
    phone?: string;
  };

  type OrderItem = {
    id: string;
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number; // cents
  };

  type Order = {
    id: string;
    customerName: string;
    email: string;
    items: OrderItem[];
    totals: {
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
      currency: 'EUR';
    };
    status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
    createdAt: string;
    date: string;
    shippingAddress: Address;
    billingAddress: Address;
    payment: {
      method: string;
      status: 'pending' | 'paid' | 'refunded' | 'failed';
      transactionId?: string;
    };
    shipping: {
      method: string;
      status: 'pending' | 'in_transit' | 'delivered';
      trackingNumber?: string;
    };
    notes?: string;
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Shipping modal state
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [shipModalOrderId, setShipModalOrderId] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<string>('DHL Tracking Number: ');
  const [shipSaving, setShipSaving] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [shipEditOnly, setShipEditOnly] = useState<boolean>(false);

  const formatEuro = (cents: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const stats = [
    {
      title: 'Ordini totali',
      value: '1,234',
      change: '+12%',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Utenti registrati',
      value: usersLoading ? '...' : (usersError ? '—' : String(usersTotal ?? 0)),
      change: usersError || usersGrowth === null ? '' : `${usersGrowth >= 0 ? '+' : ''}${usersGrowth.toFixed(1)}%`,
      icon: Users,
      color: 'green'
    },
    {
      title: 'Ricavi',
      value: '€12,456',
      change: '+15%',
      icon: DollarSign,
      color: 'purple'
    },
    {
      title: 'Crescita',
      value: '23%',
      change: '+5%',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  // Fetch total users from server route
  React.useEffect(() => {
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

  // Fetch users time-series and growth
  React.useEffect(() => {
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

  // Fetch orders with search
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set('q', searchTerm);
        const res = await fetch(`/api/admin/orders?${params.toString()}` as string, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (e) {
        if (!cancelled) setOrdersError('Impossibile caricare gli ordini');
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const openShipModal = async (orderId: string, editOnly: boolean) => {
    setShipEditOnly(editOnly);
    setShipModalOrderId(orderId);
    setShipSaving(false);
    setShipError(null);
    setShippingInfo('DHL Tracking Number: ');
    setShipModalOpen(true);
    try {
      const res = await fetch(`/api/admin/orders?order_uuid=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const current = data?.order?.spedition_info;
        if (typeof current === 'string' && current.trim()) setShippingInfo(current);
      }
    } catch {}
  };

  const saveShippingInfo = async () => {
    if (!shipModalOrderId) return;
    const val = String(shippingInfo || '').trim();
    if (!val) { setShipError('Il numero di tracking è obbligatorio'); return; }
    setShipSaving(true);
    setShipError(null);
    try {
      const body: any = { order_uuid: shipModalOrderId, spedition_info: val };
      if (!shipEditOnly) body.status = 'spedito';
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'Errore salvataggio');
      }
      setOrders((prev) => prev.map((o) => o.id === shipModalOrderId ? { ...o, status: (!shipEditOnly ? 'spedito' as any : o.status) } : o));
      setShipModalOpen(false);
    } catch (e: any) {
      setShipError(typeof e?.message === 'string' ? e.message : 'Errore imprevisto');
    } finally {
      setShipSaving(false);
    }
  };

  // Build table rows to satisfy strict typing (no null/false children)
  const renderedRows: any[] = React.useMemo(() => {
    const rows: any[] = [];
    if (ordersLoading) {
      rows.push(
        <TableRow key="loading">
          <TableCell colSpan={7}>
            <div className="py-8 text-center text-gray-500">Caricamento ordini...</div>
          </TableCell>
        </TableRow>
      );
      return rows;
    }
    if (ordersError) {
      rows.push(
        <TableRow key="error">
          <TableCell colSpan={7}>
            <div className="py-8 text-center text-red-600">{ordersError}</div>
          </TableCell>
        </TableRow>
      );
      return rows;
    }
    if (orders.length === 0) {
      rows.push(
        <TableRow key="empty">
          <TableCell colSpan={7}>
            <div className="py-8 text-center text-gray-500">Nessun ordine trovato</div>
          </TableCell>
        </TableRow>
      );
      return rows;
    }
    orders.forEach((order) => {
      const itemsPreview = order.items[0]?.name || '-';
      const more = Math.max(order.items.length - 1, 0);
      const expanded = expandedOrderId === order.id;
      rows.push(
        <TableRow key={order.id}>
          <TableCell className="font-medium">
            <div className="flex items-center">
              <button
                aria-label={expanded ? 'Chiudi dettagli' : 'Apri dettagli'}
                className="mr-2 text-gray-500 hover:text-gray-900"
                onClick={() => toggleExpand(order.id)}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <span className="flex items-center gap-2">
                {`ORD-${order.id}`}
                {order.shipping?.trackingNumber ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">DHL Tracking Number - {order.shipping.trackingNumber}</span>
                ) : null}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <div>
              <div className="font-medium">{order.customerName}</div>
              <div className="text-sm text-gray-500">{order.email}</div>
            </div>
          </TableCell>
          <TableCell>
            <div className="text-gray-900">
              {itemsPreview}{more > 0 ? ` +${more}` : ''}
            </div>
          </TableCell>
          <TableCell className="font-medium">{formatEuro(order.totals.total)}</TableCell>
          <TableCell>
            <Chip color={getStatusColor(order.status)} variant="flat" size="sm">
              {getStatusText(order.status)}
            </Chip>
          </TableCell>
          <TableCell>{order.date}</TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50"
                onPress={() => toggleExpand(order.id)}
              >
                <Eye size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="text-purple-600 hover:bg-purple-50"
                onPress={() => openShipModal(order.id, false)}
                aria-label="Segna come spedito"
              >
                <Truck size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="text-green-600 hover:bg-green-50"
                onPress={() => openShipModal(order.id, true)}
                aria-label="Modifica info spedizione"
              >
                <Edit size={16} />
              </Button>
              <Button isIconOnly size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
      if (expanded) {
        rows.push(
          <TableRow key={`${order.id}-details`}>
            <TableCell colSpan={7}>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Articoli</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="py-2 pr-4">Nome</th>
                            <th className="py-2 pr-4">SKU</th>
                            <th className="py-2 pr-4">Qtà</th>
                            <th className="py-2 pr-4">Prezzo</th>
                            <th className="py-2 pr-4">Totale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((it) => (
                            <tr key={it.id} className="border-t border-gray-200">
                              <td className="py-2 pr-4 text-gray-900">{it.name}</td>
                              <td className="py-2 pr-4 text-gray-600">{it.sku || '-'}</td>
                              <td className="py-2 pr-4">{it.quantity}</td>
                              <td className="py-2 pr-4">{formatEuro(it.unitPrice)}</td>
                              <td className="py-2 pr-4 font-medium">{formatEuro(it.unitPrice * it.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex flex-col items-end space-y-1 text-sm">
                      <div className="flex justify-between w-64">
                        <span className="text-gray-600">Subtotale</span>
                        <span className="text-gray-900">{formatEuro(order.totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between w-64">
                        <span className="text-gray-600">Spedizione</span>
                        <span className="text-gray-900">{formatEuro(order.totals.shipping)}</span>
                      </div>
                      <div className="flex justify-between w-64">
                        <span className="text-gray-600">Tasse</span>
                        <span className="text-gray-900">{formatEuro(order.totals.tax)}</span>
                      </div>
                      <div className="flex justify-between w-64 font-semibold">
                        <span className="text-gray-900">Totale</span>
                        <span className="text-gray-900">{formatEuro(order.totals.total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Dettagli pagamento</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-gray-700"><CreditCard size={16} className="mr-2" />Metodo: {order.payment.method}</div>
                        <div className="flex items-center text-gray-700">Stato: {order.payment.status}</div>
                        {order.payment.transactionId && (
                          <div className="flex items-center text-gray-700">Transazione: {order.payment.transactionId}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Spedizione</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-gray-700"><Truck size={16} className="mr-2" />Metodo: {order.shipping.method}</div>
                        <div className="flex items-center text-gray-700">Stato: {order.shipping.status}</div>
                        {order.shipping.trackingNumber && (
                          <div className="flex items-center text-gray-700">Tracking: {order.shipping.trackingNumber}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Indirizzi</h4>
                      <div className="text-sm">
                        <div className="mb-2">
                          <div className="font-medium flex items-center text-gray-900"><MapPin size={16} className="mr-2" />Spedizione</div>
                          <div className="text-gray-700">{order.shippingAddress.fullName}</div>
                          <div className="text-gray-700">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</div>
                          <div className="text-gray-700">{order.shippingAddress.postalCode} {order.shippingAddress.city} {order.shippingAddress.state ? `(${order.shippingAddress.state})` : ''}</div>
                          <div className="text-gray-700">{order.shippingAddress.country}{order.shippingAddress.phone ? `, ${order.shippingAddress.phone}` : ''}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Fatturazione</div>
                          <div className="text-gray-700">{order.billingAddress.fullName}</div>
                          <div className="text-gray-700">{order.billingAddress.line1}{order.billingAddress.line2 ? `, ${order.billingAddress.line2}` : ''}</div>
                          <div className="text-gray-700">{order.billingAddress.postalCode} {order.billingAddress.city} {order.billingAddress.state ? `(${order.billingAddress.state})` : ''}</div>
                          <div className="text-gray-700">{order.billingAddress.country}</div>
                        </div>
                      </div>
                    </div>
                    {order.notes ? (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Note</h4>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    ) : undefined}
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        );
      }
    });
    return rows;
  }, [ordersLoading, ordersError, orders, expandedOrderId]);

  const UsersChart = ({ series }: { series: Array<{ date: string; count: number }> }) => {
    if (!series.length) return <div className="h-16" />;
    const data = series.map((s) => ({ date: s.date.slice(5), value: s.count }));
    return (
      <div className="mt-2">
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                formatter={(value: number) => [String(value), 'Registrazioni']}
                labelFormatter={(label: string) => `Giorno: ${label}`}
              />
              <Area type="monotone" dataKey="value" stroke="#16a34a" fill="url(#usersGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-gray-500">Ultimi 30 giorni</p>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'shipped':
        return 'primary';
      case 'pending':
        return 'default';
      case 'cancelled':
      case 'refunded':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completato';
      case 'processing':
        return 'In lavorazione';
      case 'shipped':
        return 'Spedito';
      case 'pending':
        return 'In attesa';
      case 'cancelled':
        return 'Annullato';
      case 'refunded':
        return 'Rimborsato';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-gray-600">Gestisci ordini e prodotti</p>
            </div>
            <Button
              color="primary"
              startContent={<Plus size={16} />}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Nuovo prodotto
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <Card className="border border-gray-200">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.title === 'Utenti registrati' ? (
                        <p className={`text-sm ${Number(usersGrowth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </p>
                      ) : (
                        <p className="text-sm text-green-600">{stat.change}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-100' :
                      stat.color === 'green' ? 'bg-green-100' :
                      stat.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <stat.icon size={24} className={`${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                  </div>
                  {stat.title === 'Utenti registrati' && (
                    <UsersChart series={usersSeries} />
                  )}
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Orders Table */
        }
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border border-gray-200">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex justify-between items-center w-full">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ordini recenti</h3>
                  <p className="text-sm text-gray-600">Gestisci tutti gli ordini dei clienti</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="Cerca ordini..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    startContent={<Search size={16} className="text-gray-400" />}
                    className="w-64"
                    classNames={{
                      input: "text-gray-900",
                      inputWrapper: "border-gray-200 hover:border-purple-300 focus-within:border-purple-500"
                    }}
                  />
                  <Button
                    variant="bordered"
                    startContent={<Filter size={16} />}
                    className="border-gray-200"
                  >
                    Filtri
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="px-6 py-6">
              <Table aria-label="Orders table">
                <TableHeader>
                  <TableColumn>ID ORDINE</TableColumn>
                  <TableColumn>CLIENTE</TableColumn>
                  <TableColumn>ARTICOLI</TableColumn>
                  <TableColumn>TOTALE</TableColumn>
                  <TableColumn>STATO</TableColumn>
                  <TableColumn>DATA</TableColumn>
                  <TableColumn>AZIONI</TableColumn>
                </TableHeader>
                <TableBody>{renderedRows}</TableBody>
              </Table>
            </CardBody>
          </Card>
        </motion.div>

        {/* Placeholder Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardBody className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⚠️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Modalità Demo</h4>
                  <p className="text-yellow-700 text-sm">
                    Questa è una versione demo dell&apos;admin dashboard. Le funzionalità complete saranno disponibili 
                    con l&apos;integrazione del backend Appwrite.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
