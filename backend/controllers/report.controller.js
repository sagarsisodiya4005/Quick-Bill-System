const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const InventoryLog = require('../models/InventoryLog.model');

// GET /api/reports/sales
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { status: 'completed' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('cashier', 'name');
    const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);
    const totalTax = orders.reduce((s, o) => s + o.tax, 0);
    const totalDiscount = orders.reduce((s, o) => s + o.discount, 0);
    res.json({ success: true, data: { orders, summary: { totalOrders: orders.length, totalRevenue, totalTax, totalDiscount } } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/inventory
const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ stock: 1 });
    const logs = await InventoryLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: { products, logs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/best-selling
const getBestSelling = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    let match = { status: 'completed' };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const result = await Order.aggregate([
      { $match: match }, { $unwind: '$items' },
      { $group: { _id: '$items.productId', name: { $first: '$items.productName' }, totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.subtotal' } } },
      { $sort: { totalQty: -1 } }, { $limit: Number(limit) },
    ]);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSalesReport, getInventoryReport, getBestSelling };
