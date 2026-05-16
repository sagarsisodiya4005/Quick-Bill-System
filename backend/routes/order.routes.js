const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, cancelOrder } = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.patch('/cancel/:id', protect, cancelOrder);

module.exports = router;
