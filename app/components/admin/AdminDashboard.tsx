'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input } from '@heroui/react';
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
  Plus
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

  // Mock data for orders
  const orders = [
    {
      id: 'ORD-001',
      customer: 'Mario Rossi',
      email: 'mario.rossi@email.com',
      product: 'Sticker Pack Vintage',
      quantity: 2,
      total: '€25.98',
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: 'ORD-002',
      customer: 'Giulia Bianchi',
      email: 'giulia.bianchi@email.com',
      product: 'Sticker Personalizzato',
      quantity: 1,
      total: '€15.99',
      status: 'processing',
      date: '2024-01-14'
    },
    {
      id: 'ORD-003',
      customer: 'Luca Verdi',
      email: 'luca.verdi@email.com',
      product: 'Sticker Pack Neon',
      quantity: 3,
      total: '€47.97',
      status: 'shipped',
      date: '2024-01-13'
    },
    {
      id: 'ORD-004',
      customer: 'Anna Neri',
      email: 'anna.neri@email.com',
      product: 'Sticker Kawaii',
      quantity: 1,
      total: '€14.99',
      status: 'pending',
      date: '2024-01-12'
    }
  ];

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

        {/* Orders Table */}
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
                  <TableColumn>PRODOTTO</TableColumn>
                  <TableColumn>QUANTITÀ</TableColumn>
                  <TableColumn>TOTALE</TableColumn>
                  <TableColumn>STATO</TableColumn>
                  <TableColumn>DATA</TableColumn>
                  <TableColumn>AZIONI</TableColumn>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-sm text-gray-500">{order.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="font-medium">{order.total}</TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(order.status)}
                          variant="flat"
                          size="sm"
                        >
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
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
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
