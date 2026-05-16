const Product = require('../models/Product.model');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20, all } = req.query;
    let query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
    if (category && category !== 'all') query.category = category;

    if (all === 'true') {
      const products = await Product.find(query).sort({ name: 1 });
      return res.json({ success: true, data: products });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ]);
    res.json({ success: true, data: products, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, data: categories.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getCategories };
