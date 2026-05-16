const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  type: { type: String, enum: ['SALE', 'RESTOCK', 'ADJUSTMENT'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
