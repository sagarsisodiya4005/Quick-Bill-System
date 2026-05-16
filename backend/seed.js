require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const Product = require('./models/Product.model');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  // Seed admin user
  const existing = await User.findOne({ email: 'admin@quickbill.com' });
  if (!existing) {
    await User.create({ name: 'Meera Admin', email: 'admin@quickbill.com', password: 'Admin@123', role: 'admin' });
    console.log('✅ Admin user created: admin@quickbill.com / Admin@123');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Seed sample products
  const count = await Product.countDocuments();
  if (count === 0) {
    const categories = ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Personal Care'];
    const products = [
      { name: 'Coca Cola 500ml', sku: 'BEV001', barcode: '8901234567890', category: 'Beverages', sellingPrice: 40, costPrice: 28, stock: 100, lowStockThreshold: 20, description: 'Refreshing cola drink.' },
      { name: 'Pepsi 500ml', sku: 'BEV002', barcode: '8901234567891', category: 'Beverages', sellingPrice: 40, costPrice: 28, stock: 80, lowStockThreshold: 20, description: 'Classic pepsi cola.' },
      { name: 'Lay\'s Classic Salted', sku: 'SNK001', barcode: '8901234567892', category: 'Snacks', sellingPrice: 20, costPrice: 13, stock: 150, lowStockThreshold: 30, description: 'Crispy potato chips.' },
      { name: 'Kurkure Masala Munch', sku: 'SNK002', barcode: '8901234567893', category: 'Snacks', sellingPrice: 20, costPrice: 13, stock: 5, lowStockThreshold: 20, description: 'Spicy corn puffs.' },
      { name: 'Amul Butter 100g', sku: 'DRY001', barcode: '8901234567894', category: 'Dairy', sellingPrice: 55, costPrice: 44, stock: 40, lowStockThreshold: 10, description: 'Pure buffalo milk butter.' },
      { name: 'Amul Milk 1L', sku: 'DRY002', barcode: '8901234567895', category: 'Dairy', sellingPrice: 68, costPrice: 58, stock: 8, lowStockThreshold: 15, description: 'Full cream fresh milk.' },
      { name: 'Britannia Bread', sku: 'BAK001', barcode: '8901234567896', category: 'Bakery', sellingPrice: 45, costPrice: 35, stock: 25, lowStockThreshold: 10, description: 'Soft white sandwich bread.' },
      { name: 'Good Day Biscuits', sku: 'BAK002', barcode: '8901234567897', category: 'Bakery', sellingPrice: 30, costPrice: 20, stock: 60, lowStockThreshold: 15, description: 'Butter cookies with cashew.' },
      { name: 'Dove Soap 100g', sku: 'PCA001', barcode: '8901234567898', category: 'Personal Care', sellingPrice: 68, costPrice: 50, stock: 35, lowStockThreshold: 10, description: 'Moisturizing beauty bar.' },
      { name: 'Colgate Toothpaste', sku: 'PCA002', barcode: '8901234567899', category: 'Personal Care', sellingPrice: 85, costPrice: 65, stock: 3, lowStockThreshold: 10, description: 'Cavity protection toothpaste.' },
    ];
    await Product.insertMany(products);
    console.log(`✅ ${products.length} sample products created`);
  } else {
    console.log(`ℹ️ Products already exist (${count})`);
  }

  console.log('\n🎉 Seed complete! Login with:');
  console.log('   Email:    admin@quickbill.com');
  console.log('   Password: Admin@123\n');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
