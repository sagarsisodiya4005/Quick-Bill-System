import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, XCircle, Loader2, Filter, FileText } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import InvoiceModal from '../components/pos/InvoiceModal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', { params: { search, status, page, limit: 15 } });
      setOrders(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const cancelOrder = async (id) => {
    if (!window.confirm('Cancel this order and restore stock?')) return;
    try {
      await api.patch(`/orders/cancel/${id}`);
      toast.success('Order cancelled and stock restored');
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
  };

  const viewOrder = async (id) => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setSelectedOrder(data.data);
    } catch { toast.error('Failed to load order'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search order number, customer..." />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><br />No orders found</td></tr>
              )}
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="font-mono text-xs font-semibold text-indigo-600">{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td className="text-gray-500">{order.items?.length} items</td>
                  <td><span className="capitalize badge-blue">{order.paymentMethod}</span></td>
                  <td className="font-semibold text-emerald-600">{formatCurrency(order.grandTotal)}</td>
                  <td><span className={order.status === 'completed' ? 'badge-green' : 'badge-red'}>{order.status}</span></td>
                  <td className="text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => viewOrder(order._id)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 rounded-lg" title="View Invoice">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {order.status === 'completed' && (
                        <button onClick={() => cancelOrder(order._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg" title="Cancel Order">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-xs">Prev</button>
          <span className="text-sm text-gray-500 flex items-center px-3">{page} / {pagination.pages}</span>
          <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
        </div>
      )}

      {selectedOrder && <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
