const express = require('express');
const router = express.Router();
const { getLowStock, restockProduct, getLogs } = require('../controllers/inventory.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/low-stock', protect, getLowStock);
router.get('/logs', protect, getLogs);
router.patch('/restock/:id', protect, adminOnly, restockProduct);

module.exports = router;
