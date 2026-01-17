import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get packages by product (public - only enabled)
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const packages = await prisma.package.findMany({
      where: { 
        productId,
        enabled: true 
      },
      orderBy: { price: 'asc' }
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all packages for product including disabled (admin only)
router.get('/product/:productId/admin', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const packages = await prisma.package.findMany({
      where: { productId },
      orderBy: { price: 'asc' }
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single package
router.get('/:id', async (req, res) => {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    res.json(pkg);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create package (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_id, name, description, price, enabled } = req.body;
    
    if (!product_id || !name || price === undefined) {
      return res.status(400).json({ error: 'Product ID, name, and price are required' });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const pkg = await prisma.package.create({
      data: {
        productId: parseInt(product_id),
        name,
        description: description || null,
        price: parseFloat(price),
        enabled: enabled !== undefined ? Boolean(enabled) : true
      }
    });

    res.status(201).json(pkg);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update package (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, price, enabled } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete package (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.package.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Package not found' });
    }
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;