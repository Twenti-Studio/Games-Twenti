import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get all products (public - only enabled)
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { enabled: true },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Map to include category_name dan category_slug (backward compatibility)
    const result = products.map(p => ({
      ...p,
      category_name: p.category.name,
      category_slug: p.category.slug,
      category: undefined
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all products including disabled (admin only)
router.get('/admin', requireAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const result = products.map(p => ({
      ...p,
      category_name: p.category.name,
      category_slug: p.category.slug,
      category: undefined
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products by category (public)
router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);

    const products = await prisma.product.findMany({
      where: { 
        categoryId,
        enabled: true 
      },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const result = products.map(p => ({
      ...p,
      category_name: p.category.name,
      category_slug: p.category.slug,
      category: undefined
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      ...product,
      category_name: product.category.name,
      category_slug: product.category.slug,
      category: undefined
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { category_id, name, slug, description, image_url, service_type, input_fields, enabled } = req.body;
    
    if (!category_id || !name || !slug || !service_type || !input_fields) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate input_fields
    let parsedFields;
    try {
      parsedFields = typeof input_fields === 'string' ? JSON.parse(input_fields) : input_fields;
      if (!Array.isArray(parsedFields)) {
        throw new Error('input_fields must be an array');
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid input_fields format' });
    }

    const product = await prisma.product.create({
      data: {
        categoryId: parseInt(category_id),
        name,
        slug,
        description: description || null,
        imageUrl: image_url || null,
        serviceType: service_type,
        inputFields: parsedFields,
        enabled: enabled !== undefined ? Boolean(enabled) : true
      },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    });

    res.status(201).json({
      ...product,
      category_name: product.category.name,
      category_slug: product.category.slug,
      category: undefined
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this slug already exists' });
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { category_id, name, slug, description, image_url, service_type, input_fields, enabled } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate input_fields if provided
    let parsedFields = existing.inputFields;
    if (input_fields) {
      try {
        parsedFields = typeof input_fields === 'string' ? JSON.parse(input_fields) : input_fields;
        if (!Array.isArray(parsedFields)) {
          throw new Error('input_fields must be an array');
        }
      } catch (e) {
        return res.status(400).json({ error: 'Invalid input_fields format' });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        categoryId: category_id ? parseInt(category_id) : existing.categoryId,
        name: name || existing.name,
        slug: slug || existing.slug,
        description: description !== undefined ? description : existing.description,
        imageUrl: image_url !== undefined ? image_url : existing.imageUrl,
        serviceType: service_type || existing.serviceType,
        inputFields: parsedFields,
        enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled
      },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    });

    res.json({
      ...updated,
      category_name: updated.category.name,
      category_slug: updated.category.slug,
      category: undefined
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this slug already exists' });
    }
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if product has packages
    const packageCount = await prisma.package.count({
      where: { productId: id }
    });

    if (packageCount > 0) {
      return res.status(400).json({ error: 'Cannot delete product with existing packages' });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;