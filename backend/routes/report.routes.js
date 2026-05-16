const express = require('express');
const router = express.Router();
const { getSalesReport, getInventoryReport, getBestSelling } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/sales', protect, getSalesReport);
router.get('/inventory', protect, getInventoryReport);
router.get('/best-selling', protect, getBestSelling);

module.exports = router;
