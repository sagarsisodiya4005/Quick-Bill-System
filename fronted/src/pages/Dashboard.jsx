import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, sub, icon: Icon, color, change }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {change !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}% vs last month
      </div>
    )}
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/dashboard/stats'), api.get(`/dashboard/charts?period=${period}`)]);
      setStats(s.data.data);
      setCharts(c.data.data);
    } catch (err) { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [period]);

  const getAiSummary = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/sales-summary');
      setAiSummary(data.data.summary);
    } catch (err) { toast.error('AI summary failed'); }
    finally { setAiLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const monthChange = stats?.lastMonth?.sales > 0 ? ((stats.month.sales - stats.lastMonth.sales) / stats.lastMonth.sales) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <button onClick={fetchData} className="btn-secondary gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={formatCurrency(stats?.today?.sales)} sub={`${stats?.today?.orders} orders today`} icon={TrendingUp} color="bg-indigo-500" />
        <StatCard title="Monthly Revenue" value={formatCurrency(stats?.month?.sales)} sub={`${stats?.month?.orders} orders`} icon={ShoppingBag} color="bg-emerald-500" change={monthChange} />
        <StatCard title="Total Products" value={stats?.totalProducts || 0} sub="Active products" icon={Package} color="bg-cyan-500" />
        <StatCard title="Low Stock Alerts" value={stats?.lowStockCount || 0} sub="Need restocking" icon={AlertTriangle} color={stats?.lowStockCount > 0 ? 'bg-amber-500' : 'bg-gray-400'} />
      </div>

      {/* AI Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Sales Insight</h2>
          </div>
          <button onClick={getAiSummary} disabled={aiLoading} className="btn-secondary text-xs">
            {aiLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : 'Generate Insight'}
          </button>
        </div>
        {aiSummary ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{aiSummary}</motion.p>
        ) : (
          <p className="text-sm text-gray-400 italic">Click "Generate Insight" to get AI-powered analysis of your sales.</p>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
            <div className="flex gap-1">
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${period === p ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts?.salesData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: '#e5e7eb' }} itemStyle={{ color: '#818cf8' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts?.categorySales || []} dataKey="revenue" nameKey="_id" cx="50%" cy="50%" outerRadius={75} paddingAngle={2}>
                {(charts?.categorySales || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Best Selling Products</h2>
          <div className="space-y-3">
            {stats?.bestSelling?.length === 0 && <p className="text-gray-400 text-sm">No sales data yet.</p>}
            {(stats?.bestSelling || []).map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.totalQty} units sold</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(p.totalRev)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {stats?.recentOrders?.length === 0 && <p className="text-gray-400 text-sm">No orders yet.</p>}
            {(stats?.recentOrders || []).map(o => (
              <div key={o._id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400 truncate">{o.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(o.grandTotal)}</p>
                  <span className="badge-green text-xs">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        {stats?.lowStockProducts?.length > 0 && (
          <div className="lg:col-span-2 card p-5 border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.lowStockProducts.map(p => (
                <div key={p._id} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-amber-200 dark:border-amber-800/40">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>
                  <p className="text-lg font-bold text-amber-600 mt-1">{p.stock}</p>
                  <p className="text-xs text-gray-400">/{p.lowStockThreshold} threshold</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
