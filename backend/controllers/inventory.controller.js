const mongoose = require('mongoose');
const Product = require('../models/Product.model');
const InventoryLog = require('../models/InventoryLog.model');

// GET /api/inventory/low-stock
const getLowStock = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter(p => p.stock <= p.lowStockThreshold);
    res.json({ success: true, data: lowStock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/inventory/restock/:id
const restockProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity, notes } = req.body;
    if (!quantity || Number(quantity) <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const previousStock = product.stock;
    product.stock += Number(quantity);
    await product.save({ session });
    await InventoryLog.create([{
      productId: product._id, productName: product.name,
      type: 'RESTOCK', quantity: Number(quantity),
      previousStock, newStock: product.stock,
      createdBy: req.user._id, createdByName: req.user.name, notes,
    }], { session });
    await session.commitTransaction();
    res.json({ success: true, data: product, message: 'Stock updated' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/inventory/logs
const getLogs = async (req, res) => {
  try {
    const { productId, type, page = 1, limit = 20 } = req.query;
    let query = {};
    if (productId) query.productId = productId;
    if (type) query.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [total, logs] = await Promise.all([
      InventoryLog.countDocuments(query),
      InventoryLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ]);
    res.json({ success: true, data: logs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLowStock, restockProduct, getLogs };
