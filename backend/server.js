require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// express-mongo-sanitize removed — incompatible with Express 5 (req.query is read-only)

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const orderRoutes = require('./routes/order.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const aiRoutes = require('./routes/ai.routes');
const uploadRoutes = require('./routes/upload.routes');

// Connect to DB
connectDB();

const app = express();

// ✅ CORS MUST come first — before helmet and everything else
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman) and localhost
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions)); // Handle preflight for ALL routes (Express 5 compatible)

// Security (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));


// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging in dev
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'QuickBill API is running!' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, () => console.log(`🚀 QuickBill server running on http://localhost:${PORT}`));
