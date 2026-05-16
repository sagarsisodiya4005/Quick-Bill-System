const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const InventoryLog = require('../models/InventoryLog.model');
const generateOrderNumber = require('../utils/generateOrderNumber');

// POST /api/orders
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, customerName, customerPhone, paymentMethod, subtotal, tax, taxRate, discount, grandTotal, notes } = req.body;
    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    // Validate stock
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) { await session.abortTransaction(); return res.status(404).json({ success: false, message: `Product not found: ${item.productName}` }); }
      if (product.stock < item.quantity) { await session.abortTransaction(); return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` }); }
    }

    const logs = [];
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      const prevStock = product.stock;
      product.stock -= item.quantity;
      await product.save({ session });
      logs.push({ productId: product._id, productName: product.name, type: 'SALE', quantity: item.quantity, previousStock: prevStock, newStock: product.stock, createdBy: req.user._id, createdByName: req.user.name });
    }

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(), items,
      customerName: customerName || 'Walk-in Customer', customerPhone,
      paymentMethod, subtotal, tax: tax || 0, taxRate: taxRate || 0, discount: discount || 0, grandTotal,
      status: 'completed', cashier: req.user._id, cashierName: req.user.name, notes,
    }], { session });

    logs.forEach(l => l.orderId = order._id);
    await InventoryLog.insertMany(logs, { session });
    await session.commitTransaction();
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally { session.endSession(); }
};

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (search) query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }, { customerName: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('cashier', 'name'),
    ]);
    res.json({ success: true, data: orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('cashier', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/cancel/:id
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Order not found' }); }
    if (order.status === 'cancelled') { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'Already cancelled' }); }

    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        const prevStock = product.stock;
        product.stock += item.quantity;
        await product.save({ session });
        await InventoryLog.create([{ productId: product._id, productName: product.name, type: 'ADJUSTMENT', quantity: item.quantity, previousStock: prevStock, newStock: product.stock, createdBy: req.user._id, createdByName: req.user.name, orderId: order._id, notes: 'Order cancelled - stock restored' }], { session });
      }
    }

    order.status = 'cancelled';
    await order.save({ session });
    await session.commitTransaction();
    res.json({ success: true, data: order, message: 'Order cancelled and stock restored' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally { session.endSession(); }
};

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
