import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Helper to transform Prisma order to snake_case for frontend compatibility
const transformOrder = (order) => ({
  id: order.id,
  product_id: order.productId,
  package_id: order.packageId,
  product_name: order.productName,
  category_name: order.categoryName,
  package_name: order.packageName,
  price: parseFloat(order.price),
  user_data: order.userData,
  status: order.status,
  created_at: order.createdAt
});

// Create order (public - from checkout)
router.post('/', async (req, res) => {
  try {
    const { product_id, package_id, user_data } = req.body;
    
    if (!product_id || !package_id || !user_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const productIdInt = parseInt(product_id);
    const packageIdInt = parseInt(package_id);

    // Get product and package info
    const product = await prisma.product.findUnique({
      where: { id: productIdInt },
      include: {
        category: {
          select: { name: true }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const pkg = await prisma.package.findFirst({
      where: { 
        id: packageIdInt,
        enabled: true 
      }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found or disabled' });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId: productIdInt,
        packageId: packageIdInt,
        productName: product.name,
        categoryName: product.category.name,
        packageName: pkg.name,
        price: pkg.price,
        userData: user_data,
        status: 'pending'
      }
    });

    res.status(201).json(transformOrder(order));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders.map(transformOrder));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order (admin only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(transformOrder(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (admin only)
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(transformOrder(updated));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;