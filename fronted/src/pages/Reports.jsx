import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Package, TrendingUp, Loader2, Calendar } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'sales') res = await api.get('/reports/sales', { params: { startDate, endDate } });
      else if (tab === 'inventory') res = await api.get('/reports/inventory');
      else res = await api.get('/reports/best-selling', { params: { startDate, endDate } });
      setData(res.data.data);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const exportToExcel = () => {
    if (!data) return;
    let rows = [];
    if (tab === 'sales' && data.orders) {
      rows = data.orders.map(o => ({
        'Order #': o.orderNumber,
        'Customer': o.customerName,
        'Items': o.items?.length,
        'Subtotal': o.subtotal,
        'Tax': o.tax,
        'Discount': o.discount,
        'Grand Total': o.grandTotal,
        'Payment': o.paymentMethod,
        'Status': o.status,
        'Cashier': o.cashierName,
        'Date': formatDate(o.createdAt),
      }));
    } else if (tab === 'inventory' && data.products) {
      rows = data.products.map(p => ({
        'Product': p.name, 'SKU': p.sku, 'Category': p.category,
        'Stock': p.stock, 'Low Stock Threshold': p.lowStockThreshold,
        'Selling Price': p.sellingPrice, 'Cost Price': p.costPrice,
        'Stock Value': p.stock * p.costPrice,
        'Status': p.stock === 0 ? 'Out of Stock' : p.isLowStock ? 'Low Stock' : 'In Stock',
      }));
    } else if (tab === 'best' && data) {
      rows = data.map(p => ({ 'Product': p.name, 'Total Qty Sold': p.totalQty, 'Total Revenue': p.totalRev }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `QuickBill-${tab}-report-${Date.now()}.xlsx`);
    toast.success('Report exported!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and export business reports</p></div>
        {data && <button onClick={exportToExcel} className="btn-success"><Download className="w-4 h-4" />Export Excel</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['sales', 'Sales Report', FileText], ['inventory', 'Inventory Report', Package], ['best', 'Best Selling', TrendingUp]].map(([k, l, Icon]) => (
          <button key={k} onClick={() => { setTab(k); setData(null); }} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all ${tab === k ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Icon className="w-4 h-4" />{l}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab !== 'inventory' && (
        <div className="card p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"><Calendar className="w-4 h-4" />Date Range:</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-auto" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-auto" />
            <button onClick={fetchReport} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : 'Generate Report'}
            </button>
          </div>
        </div>
      )}
      {tab === 'inventory' && (
        <button onClick={fetchReport} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</> : 'Load Inventory Report'}
        </button>
      )}

      {/* Results */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {tab === 'sales' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Total Orders', value: data.summary?.totalOrders },
                  { label: 'Total Revenue', value: formatCurrency(data.summary?.totalRevenue) },
                  { label: 'Total Tax', value: formatCurrency(data.summary?.totalTax) },
                  { label: 'Total Discount', value: formatCurrency(data.summary?.totalDiscount) },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-4"><p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p></div>
                ))}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Order #</th><th>Customer</th><th>Payment</th><th>Total</th><th>Cashier</th><th>Date</th></tr></thead>
                  <tbody>
                    {data.orders?.map(o => (
                      <tr key={o._id}>
                        <td className="font-mono text-xs text-indigo-600 font-semibold">{o.orderNumber}</td>
                        <td>{o.customerName}</td>
                        <td className="capitalize">{o.paymentMethod}</td>
                        <td className="font-semibold text-emerald-600">{formatCurrency(o.grandTotal)}</td>
                        <td className="text-gray-400">{o.cashierName}</td>
                        <td className="text-gray-400 text-xs">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'inventory' && (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Product</th><th>Category</th><th>SKU</th><th>Stock</th><th>Value</th><th>Status</th></tr></thead>
                <tbody>
                  {data.products?.map(p => (
                    <tr key={p._id}>
                      <td className="font-medium">{p.name}</td>
                      <td className="text-gray-400">{p.category}</td>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td className={`font-bold ${p.stock === 0 ? 'text-red-500' : p.isLowStock ? 'text-amber-500' : 'text-emerald-600'}`}>{p.stock}</td>
                      <td>{formatCurrency(p.stock * p.costPrice)}</td>
                      <td><span className={`badge ${p.stock === 0 ? 'badge-red' : p.isLowStock ? 'badge-yellow' : 'badge-green'}`}>{p.stock === 0 ? 'Out' : p.isLowStock ? 'Low' : 'OK'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'best' && data.length > 0 && (
            <>
              <div className="card p-5 mb-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Products by Units Sold</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [v, 'Units']} />
                    <Bar dataKey="totalQty" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {data.map((p, i) => (
                      <tr key={p._id}><td className="text-gray-400">{i + 1}</td><td className="font-medium">{p.name}</td>
                        <td className="font-bold text-indigo-600">{p.totalQty}</td>
                        <td className="font-semibold text-emerald-600">{formatCurrency(p.totalRev)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      )}

      {!data && !loading && (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Select a report type and click Generate</p>
        </div>
      )}
    </div>
  );
}
