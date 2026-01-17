import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import prisma from './database/prisma.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import packageRoutes from './routes/packages.js';
import productRoutes from './routes/products.js';
import publicRoutes from './routes/public.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection
prisma.$connect()
  .then(() => console.log('✓ Database connected'))
  .catch((err) => console.error('✗ Database connection failed:', err));

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL || true)
    : 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for secure cookies behind reverse proxy (Fly.io/Render)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-origin
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
