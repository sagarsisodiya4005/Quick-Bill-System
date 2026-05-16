const axios = require('axios');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ✅ Confirmed working free models (tested live)
// Primary: liquid/lfm-2.5-1.2b-instruct:free
// Others kept as fallback — OpenRouter availability changes hourly
const FREE_MODELS = [
  'liquid/lfm-2.5-1.2b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-26b-a4b-it:free',
];

const callAI = async (prompt) => {
  let lastError = new Error('AI service temporarily unavailable');

  for (const model of FREE_MODELS) {
    try {
      console.log(`🤖 Trying: ${model}`);
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant for a retail POS system. Be concise and practical.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'QuickBill POS',
          },
          timeout: 20000,
        }
      );

      // Handle error in response body
      if (response.data?.error) {
        const errMsg = response.data.error.message || 'Model error';
        console.warn(`  ⚠️  Body error: ${errMsg}`);
        lastError = new Error(errMsg);
        continue;
      }

      // Get content — try standard field first
      const choice = response.data?.choices?.[0];
      const content = choice?.message?.content || choice?.text || '';

      if (content && content.trim().length > 5) {
        console.log(`  ✅ Success from: ${model}`);
        return content.trim();
      }

      console.warn(`  ⚠️  Empty response from: ${model}`);
      lastError = new Error(`Empty response from ${model}`);
      continue;

    } catch (err) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message || 'Unknown error';
      console.warn(`  ❌ ${model}: ${errMsg}`);
      lastError = new Error(errMsg);
      continue; // always try next model
    }
  }

  throw lastError;
};

// POST /api/ai/generate-description
const generateDescription = async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !category)
      return res.status(400).json({ success: false, message: 'Name and category required' });

    const prompt = `Write a 2-sentence product description for a retail item.
Name: ${name}
Category: ${category}
Price: Rs.${price || 'N/A'}
Keep it short, appealing, and professional. No bullet points, just plain sentences.`;

    const description = await callAI(prompt);
    res.json({ success: true, data: { description } });
  } catch (err) {
    console.error('AI generate-description error:', err.message);
    res.status(500).json({ success: false, message: `AI unavailable: ${err.message}` });
  }
};

// POST /api/ai/sales-summary
const getSalesSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);

    const [todayOrders, weekOrders] = await Promise.all([
      Order.find({ status: 'completed', createdAt: { $gte: todayStart } }),
      Order.find({ status: 'completed', createdAt: { $gte: weekStart } }),
    ]);

    const todaySales = todayOrders.reduce((s, o) => s + o.grandTotal, 0);
    const weekSales = weekOrders.reduce((s, o) => s + o.grandTotal, 0);

    const prompt = `Retail shop data summary:
- Today: ${todayOrders.length} orders, Rs.${todaySales.toFixed(0)} revenue
- This week: ${weekOrders.length} orders, Rs.${weekSales.toFixed(0)} revenue
Write 2-3 sentences analyzing performance and give one actionable tip. Plain text only.`;

    const summary = await callAI(prompt);
    res.json({
      success: true,
      data: {
        summary,
        stats: {
          todaySales,
          todayOrders: todayOrders.length,
          weekSales,
          weekOrders: weekOrders.length,
        },
      },
    });
  } catch (err) {
    console.error('AI sales-summary error:', err.message);
    res.status(500).json({ success: false, message: `AI unavailable: ${err.message}` });
  }
};

// POST /api/ai/restock-suggestions
const getRestockSuggestions = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products
      .filter(p => p.stock <= p.lowStockThreshold)
      .map(p => `${p.name} (stock: ${p.stock}, needs: ${p.lowStockThreshold})`);

    if (lowStock.length === 0) {
      return res.json({
        success: true,
        data: { suggestions: '✅ All products are well-stocked! No restocking needed at this time.', lowStockItems: [] },
      });
    }

    const prompt = `Inventory alert for a retail shop. These items need restocking:
${lowStock.slice(0, 8).join(', ')}
Write 2-3 sentences with practical restock recommendations. Plain text, no bullet points.`;

    const suggestions = await callAI(prompt);
    res.json({
      success: true,
      data: {
        suggestions,
        lowStockItems: products
          .filter(p => p.stock <= p.lowStockThreshold)
          .map(p => ({ name: p.name, stock: p.stock, threshold: p.lowStockThreshold, category: p.category })),
      },
    });
  } catch (err) {
    console.error('AI restock-suggestions error:', err.message);
    res.status(500).json({ success: false, message: `AI unavailable: ${err.message}` });
  }
};

module.exports = { generateDescription, getSalesSummary, getRestockSuggestions };
