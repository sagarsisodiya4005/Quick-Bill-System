const express = require('express');
const router = express.Router();
const { getStats, getCharts } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/stats', protect, getStats);
router.get('/charts', protect, getCharts);

module.exports = router;
