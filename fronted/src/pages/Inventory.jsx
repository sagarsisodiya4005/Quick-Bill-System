import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, Loader2, Bot, X } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

function RestockModal({ product, onClose, onSave }) {
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qty || Number(qty) <= 0) return toast.error('Enter valid quantity');
    setLoading(true);
    try {
      await api.patch(`/inventory/restock/${product._id}`, { quantity: Number(qty), notes });
      toast.success(`Restocked ${product.name} by ${qty} units`);
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Restock failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Restock Product</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 mb-4">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Current stock: <span className={`font-bold ${product.isLowStock ? 'text-amber-500' : 'text-emerald-600'}`}>{product.stock}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantity to Add *</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="input" placeholder="e.g. 50" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="input" placeholder="Supplier name, PO number..." />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Restocking...</> : 'Restock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab] = useState('all'); // all | low | logs

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pr, lw, lg] = await Promise.all([
        api.get('/products', { params: { all: true } }),
        api.get('/inventory/low-stock'),
        api.get('/inventory/logs', { params: { limit: 30 } }),
      ]);
      setProducts(pr.data.data);
      setLowStock(lw.data.data);
      setLogs(lg.data.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const getAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/restock-suggestions');
      setAiSuggestions(data.data.suggestions);
    } catch { toast.error('AI suggestions failed'); }
    finally { setAiLoading(false); }
  };

  const display = tab === 'low' ? lowStock : products;

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lowStock.length} items need restocking</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: 'bg-indigo-500' },
          { label: 'Low Stock Items', value: lowStock.length, icon: AlertTriangle, color: lowStock.length > 0 ? 'bg-amber-500' : 'bg-gray-400' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, icon: TrendingDown, color: 'bg-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      {/* AI Suggestions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Restock Suggestions</h2>
          </div>
          <button onClick={getAiSuggestions} disabled={aiLoading} className="btn-secondary text-xs">
            {aiLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</> : 'Get Suggestions'}
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{aiSuggestions || <span className="text-gray-400 italic">Click "Get Suggestions" for AI-powered restock recommendations.</span>}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['all', 'All Products'], ['low', `Low Stock (${lowStock.length})`], ['logs', 'Movement Logs']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${tab === k ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'logs' ? (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>Before</th><th>After</th><th>By</th><th>Date</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td className="font-medium">{l.productName}</td>
                  <td><span className={`badge ${l.type === 'RESTOCK' ? 'badge-green' : l.type === 'SALE' ? 'badge-blue' : 'badge-gray'}`}>{l.type}</span></td>
                  <td className="font-semibold">{l.type === 'SALE' ? '-' : '+'}{l.quantity}</td>
                  <td className="text-gray-400">{l.previousStock}</td>
                  <td className="font-medium">{l.newStock}</td>
                  <td className="text-gray-400">{l.createdByName}</td>
                  <td className="text-gray-400 text-xs">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Product</th><th>Category</th><th>SKU</th><th>Stock</th><th>Threshold</th><th>Status</th><th>Value</th><th>Action</th></tr></thead>
            <tbody>
              {display.map(p => (
                <tr key={p._id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-gray-400">{p.category}</td>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td className={`font-bold ${p.stock === 0 ? 'text-red-500' : p.isLowStock ? 'text-amber-500' : 'text-emerald-600'}`}>{p.stock}</td>
                  <td className="text-gray-400">{p.lowStockThreshold}</td>
                  <td>
                    <span className={`badge ${p.stock === 0 ? 'badge-red' : p.isLowStock ? 'badge-yellow' : 'badge-green'}`}>
                      {p.stock === 0 ? 'Out of Stock' : p.isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td>{formatCurrency(p.stock * p.costPrice)}</td>
                  <td>
                    <button onClick={() => setRestockModal(p)} className="btn-primary py-1 px-3 text-xs"><TrendingUp className="w-3 h-3" />Restock</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {restockModal && <RestockModal product={restockModal} onClose={() => setRestockModal(null)} onSave={() => { setRestockModal(null); fetchAll(); }} />}
    </div>
  );
}
