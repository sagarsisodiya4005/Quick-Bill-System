const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  items: [orderItemSchema],
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cashierName: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
