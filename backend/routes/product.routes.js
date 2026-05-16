const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, getCategories } = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/categories', protect, getCategories);
router.get('/', protect, getProducts);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
