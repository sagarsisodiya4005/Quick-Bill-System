const express = require('express');
const router = express.Router();
const { generateDescription, getSalesSummary, getRestockSuggestions } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/generate-description', protect, generateDescription);
router.post('/sales-summary', protect, getSalesSummary);
router.post('/restock-suggestions', protect, getRestockSuggestions);

module.exports = router;
