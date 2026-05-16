import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, Loader2, Barcode, Tag, User, CreditCard, Percent, Package } from 'lucide-react';
import { addToCart, removeFromCart, updateQuantity, clearCart, setCustomer, setPaymentMethod, setDiscount, selectCartSubtotal, selectCartTax, selectCartTotal } from '../redux/slices/cartSlice';
import api from '../api/axios';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';
import InvoiceModal from '../components/pos/InvoiceModal';

export default function POS() {
  const dispatch = useDispatch();
  const cart = useSelector(s => s.cart);
  const subtotal = useSelector(selectCartSubtotal);
  const tax = useSelector(selectCartTax);
  const total = useSelector(selectCartTotal);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('all');
  const searchRef = useRef();

  const fetchProducts = async (q = '', cat = 'all') => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search: q, category: cat, all: true } });
      setProducts(data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); api.get('/products/categories').then(r => setCategories(r.data.data)); }, []);
  useEffect(() => { const t = setTimeout(() => fetchProducts(search, catFilter), 300); return () => clearTimeout(t); }, [search, catFilter]);

  // Barcode scan - press Enter in search
  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const found = products.find(p => p.barcode === search.trim() || p.sku === search.trim());
      if (found) { dispatch(addToCart(found)); setSearch(''); toast.success(`Added ${found.name}`); }
      else toast.error('Product not found by barcode/SKU');
    }
  };

  const placeOrder = async () => {
    if (cart.items.length === 0) return toast.error('Cart is empty');
    setPlacing(true);
    try {
      const payload = {
        items: cart.items.map(({ stock, ...i }) => i),
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        paymentMethod: cart.paymentMethod,
        subtotal, tax, taxRate: cart.taxRate,
        discount: cart.discount, grandTotal: total,
      };
      const { data } = await api.post('/orders', payload);
      toast.success('Order placed successfully!');
      setInvoice(data.data);
      dispatch(clearCart());
    } catch (err) { toast.error(err.response?.data?.message || 'Order failed'); }
    finally { setPlacing(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Product Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-indigo-600" /> POS Billing</h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKey}
                className="input pl-9 pr-9" placeholder="Search or scan barcode (press Enter to add by barcode)..." />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-auto">
              <option value="all">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.filter(p => p.stock > 0).map(p => (
                <motion.button key={p._id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { dispatch(addToCart(p)); toast.success(`${p.name} added`, { duration: 1000 }); }}
                  className="card p-3 text-left cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div className="w-full h-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-750 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover rounded-lg" onError={e => e.target.style.display='none'} /> : <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.category}</p>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{formatCurrency(p.sellingPrice)}</p>
                  <p className="text-xs text-gray-400">Stock: {p.stock}</p>
                </motion.button>
              ))}
              {products.filter(p => p.stock > 0).length === 0 && !loading && (
                <div className="col-span-full text-center py-16 text-gray-400">No products available</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-80 xl:w-96 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        {/* Cart header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-600" /> Cart
            {cart.items.length > 0 && <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">{cart.items.length}</span>}
          </h2>
          {cart.items.length > 0 && <button onClick={() => dispatch(clearCart())} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All</button>}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Click products to add</p>
              </div>
            ) : cart.items.map(item => (
              <motion.div key={item.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <button onClick={() => dispatch(removeFromCart(item.productId))} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))} className="w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-50">
                      <Minus className="w-3 h-3" />
                    </button>
                    <input type="number" value={item.quantity} min="1" max={item.stock}
                      onChange={e => dispatch(updateQuantity({ productId: item.productId, quantity: Number(e.target.value) }))}
                      className="w-10 text-center text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded py-0.5 text-gray-800 dark:text-gray-200" />
                    <button onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))} disabled={item.quantity >= item.stock} className="w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-indigo-600">{formatCurrency(item.subtotal)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Customer & Payment */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={cart.customerName} onChange={e => dispatch(setCustomer({ name: e.target.value, phone: cart.customerPhone }))} className="input text-xs pl-8 py-2" placeholder="Customer name (optional)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="number" min="0" value={cart.discount} onChange={e => dispatch(setDiscount(e.target.value))} className="input text-xs pl-8 py-2" placeholder="Discount ₹" />
            </div>
            <select value={cart.paymentMethod} onChange={e => dispatch(setPaymentMethod(e.target.value))} className="input text-xs py-2">
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>GST ({cart.taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(cart.discount)}</span></div>}
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Grand Total</span><span className="text-indigo-600">{formatCurrency(total)}</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={placeOrder} disabled={placing || cart.items.length === 0}
            className="w-full btn-primary py-3 text-base font-bold disabled:opacity-50">
            {placing ? <><Loader2 className="w-5 h-5 animate-spin" />Placing Order...</> : <><CheckCircle className="w-5 h-5" />Confirm Order</>}
          </motion.button>
        </div>
      </div>

      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
