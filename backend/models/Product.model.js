const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  barcode: { type: String, default: '', trim: true },
  category: { type: String, required: true, trim: true },
  sellingPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

productSchema.virtual('profit').get(function () {
  return this.sellingPrice - this.costPrice;
});

module.exports = mongoose.model('Product', productSchema);
