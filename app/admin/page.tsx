"use client";

import { useAccount } from "../components/AccountContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Package, 
  Plus, 
  Settings, 
  ShoppingCart, 
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@heroui/react";
import Link from "next/link";

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

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

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
                <p className="text-2xl font-bold text-gray-900">{mockProducts.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Crescita</p>
                <p className="text-2xl font-bold text-gray-900">+12%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
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
                  onClick={() => setActiveTab(tab.id as any)}
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
                      {mockProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                          <td className="py-3 px-4 text-gray-600">{product.category}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{product.price}</td>
                          <td className="py-3 px-4 text-gray-600">{product.stock}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.status === 'Attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" startContent={<Eye size={14} />} className="rounded-full">
                                Visualizza
                              </Button>
                              <Button size="sm" variant="ghost" startContent={<Edit size={14} />} className="rounded-full">
                                Modifica
                              </Button>
                              <Button size="sm" variant="ghost" startContent={<Trash2 size={14} />} className="rounded-full text-red-600 hover:text-red-700">
                                Elimina
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
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Prodotto</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Es. Sticker Personalizzato"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option>Stickers</option>
                          <option>Tazze</option>
                          <option>Abbigliamento</option>
                          <option>Accessori</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="9.90"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Iniziale</label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Descrizione del prodotto..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Immagine</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-4">
                      <Button variant="bordered" className="rounded-full">
                        Annulla
                      </Button>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
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
    </div>
  );
}
