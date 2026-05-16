const Order = require('../models/Order.model');
const Product = require('../models/Product.model');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [todayOrders, monthOrders, lastMonthOrders, allProducts, totalOrders, recentOrders, bestSelling] = await Promise.all([
      Order.find({ status: 'completed', createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.find({ status: 'completed', createdAt: { $gte: monthStart } }),
      Order.find({ status: 'completed', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      Product.find({ isActive: true }),
      Order.countDocuments({ status: 'completed' }),
      Order.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(5).populate('cashier', 'name'),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', name: { $first: '$items.productName' }, totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.subtotal' } } },
        { $sort: { totalQty: -1 } }, { $limit: 5 },
      ]),
    ]);

    const sum = arr => arr.reduce((s, o) => s + o.grandTotal, 0);
    const lowStock = allProducts.filter(p => p.stock <= p.lowStockThreshold);

    res.json({
      success: true, data: {
        today: { sales: sum(todayOrders), orders: todayOrders.length },
        month: { sales: sum(monthOrders), orders: monthOrders.length },
        lastMonth: { sales: sum(lastMonthOrders) },
        totalProducts: allProducts.length, totalOrders,
        lowStockCount: lowStock.length, lowStockProducts: lowStock.slice(0, 5),
        recentOrders, bestSelling,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/charts
const getCharts = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate;
    if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 6); }
    else if (period === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
    else { startDate = new Date(now.getFullYear(), 0, 1); }

    const fmt = period === 'year' ? '%Y-%m' : '%Y-%m-%d';

    const [salesData, categorySales, paymentMethods] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { status: 'completed' } }, { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$product.category', revenue: { $sum: '$items.subtotal' }, qty: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } }, { $limit: 6 },
      ]),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } },
      ]),
    ]);

    res.json({ success: true, data: { salesData, categorySales, paymentMethods } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats, getCharts };
