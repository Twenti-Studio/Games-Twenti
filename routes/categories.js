import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category (public)
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const category = await prisma.category.create({
      data: { name, slug, description, icon }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this name or slug already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: slug || existing.slug,
        description,
        icon
      }
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partial update category (admin only) - PATCH
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Build update data only with provided fields
    const updateData = {};

    if (req.body.name !== undefined) {
      updateData.name = req.body.name;
    }
    if (req.body.slug !== undefined) {
      updateData.slug = req.body.slug;
    }
    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }
    if (req.body.icon !== undefined) {
      updateData.icon = req.body.icon;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    console.error('Error patching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;