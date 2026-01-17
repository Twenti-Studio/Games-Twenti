import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Helper to transform package to snake_case
const transformPackage = (pkg) => ({
  ...pkg,
  image_url: pkg.imageUrl,
  imageUrl: undefined
});

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

    res.json(packages.map(transformPackage));
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

    res.json(packages.map(transformPackage));
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
    
    res.json(transformPackage(pkg));
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create package (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_id, name, description, image_url, price, enabled } = req.body;
    
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
        imageUrl: image_url || null,
        price: parseFloat(price),
        enabled: enabled !== undefined ? Boolean(enabled) : true
      }
    });

    // Transform to snake_case for frontend
    res.status(201).json({
      ...pkg,
      image_url: pkg.imageUrl
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update package (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, image_url, price, enabled } = req.body;
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
        imageUrl: image_url !== undefined ? image_url : existing.imageUrl,
        price: price !== undefined ? parseFloat(price) : existing.price,
        enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled
      }
    });

    // Transform to snake_case for frontend
    res.json({
      ...updated,
      image_url: updated.imageUrl
    });
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