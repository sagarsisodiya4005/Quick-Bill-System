import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Loader2, X, Bot, Package, Upload, ImageIcon } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', sku: '', barcode: '', category: '', sellingPrice: '', costPrice: '', stock: '', lowStockThreshold: 10, description: '', image: '' };

function ProductModal({ product, onClose, onSave, categories }) {
  const [form, setForm] = useState(product || EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgPreview, setImgPreview] = useState(product?.image || '');
  const isEdit = !!product?._id;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Upload image to Cloudinary via backend
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImgPreview(localUrl);
    setImgUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const cloudUrl = data.data.url;
      setImgPreview(cloudUrl);
      set('image', cloudUrl);
      toast.success('Image uploaded!');
    } catch (err) {
      setImgPreview(form.image || '');
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setImgUploading(false);
    }
  };

  const generateAiDesc = async () => {
    if (!form.name || !form.category) return toast.error('Enter name and category first');
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/generate-description', { name: form.name, category: form.category, price: form.sellingPrice });
      set('description', data.data.description);
      toast.success('AI description generated!');
    } catch { toast.error('AI generation failed'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imgUploading) return toast.error('Please wait for image to finish uploading');
    setLoading(true);
    try {
      if (isEdit) { await api.put(`/products/${product._id}`, form); toast.success('Product updated!'); }
      else { await api.post('/products', form); toast.success('Product created!'); }
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving product'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Product Image</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800 relative">
                {imgUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                {imgPreview ? (
                  <img src={imgPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" onError={() => setImgPreview('')} />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2">
                <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  {imgUploading ? 'Uploading...' : 'Choose Image'}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={imgUploading} />
                </label>
                <p className="text-xs text-gray-400">JPG, PNG, WebP — max 5MB</p>
                {imgPreview && !imgUploading && (
                  <button type="button" onClick={() => { setImgPreview(''); set('image', ''); }} className="text-xs text-red-500 hover:text-red-700">Remove image</button>
                )}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Product Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="Product name" required />
            </div>
            {[
              ['SKU *', 'sku', 'text'], ['Barcode', 'barcode', 'text'],
              ['Selling Price (₹) *', 'sellingPrice', 'number'], ['Cost Price (₹) *', 'costPrice', 'number'],
              ['Stock Qty *', 'stock', 'number'], ['Low Stock Alert', 'lowStockThreshold', 'number'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} className="input"
                  placeholder={label.replace(' *', '')} required={label.includes('*')}
                  min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category *</label>
              <input list="cats" value={form.category} onChange={e => set('category', e.target.value)} className="input" placeholder="e.g. Beverages" required />
              <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Description</label>
                <button type="button" onClick={generateAiDesc} disabled={aiLoading} className="btn-ghost text-xs py-0.5 px-2 text-indigo-600 dark:text-indigo-400">
                  {aiLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Bot className="w-3 h-3" />AI Generate</>}
                </button>
              </div>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input h-20 resize-none" placeholder="Product description..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || imgUploading} className="btn-primary flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving...' : 'Creating...'}</> : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search, category, page, limit: 12 } });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, category, page]);

  const fetchCategories = async () => {
    const { data } = await api.get('/products/categories');
    setCategories(data.data);
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setPage(1); }, [search, category]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); fetchProducts(); }
    catch { toast.error('Delete failed'); }
  };

  const onSave = () => { setModal(null); fetchProducts(); fetchCategories(); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} products total</p></div>
        <button onClick={() => setModal('add')} className="btn-primary"><Plus className="w-4 h-4" />Add Product</button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search products, SKU, barcode..." />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input w-auto">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
          <button onClick={() => setModal('add')} className="btn-primary mt-3">Add First Product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {products.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-750 flex items-center justify-center relative overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${p.image ? 'hidden' : 'flex'}`}>
                    <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  </div>
                  {p.isLowStock && (
                    <span className="absolute top-2 right-2 badge-yellow text-xs">Low Stock</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.sku} · {p.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-base font-bold text-indigo-600">{formatCurrency(p.sellingPrice)}</p>
                      <p className="text-xs text-gray-400">Stock: <span className={`font-medium ${p.isLowStock ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'}`}>{p.stock}</span></p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(p)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-xs">Prev</button>
          <span className="text-sm text-gray-500 flex items-center px-3">{page} / {pagination.pages}</span>
          <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
        </div>
      )}

      <AnimatePresence>
        {modal && <ProductModal product={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={onSave} categories={categories} />}
      </AnimatePresence>
    </div>
  );
}
