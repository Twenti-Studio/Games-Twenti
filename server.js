console.log('=== Server starting ===');

import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';

dotenv.config();

console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Database URL exists:', !!process.env.DATABASE_URL);

import prisma from './database/prisma.js';
console.log('Prisma imported');

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import packageRoutes from './routes/packages.js';
import productRoutes from './routes/products.js';
import publicRoutes from './routes/public.js';
import settingsRoutes from './routes/settings.js';
console.log('Routes imported');

const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection with retry
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✓ Database connected');
      return true;
    } catch (err) {
      console.error(`✗ Database connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log('Retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  console.error('✗ All database connection attempts failed');
  return false;
};

connectDB();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://games-twenti.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging, change to false in strict mode
    }
  },
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Game Twenti API', version: '1.0.0' });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
