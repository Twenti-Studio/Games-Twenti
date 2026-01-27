import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Helper to transform Prisma promo to snake_case for frontend
const transformPromo = (promo) => ({
  id: promo.id,
  code: promo.code,
  discount_type: promo.discountType,
  discount_value: parseFloat(promo.discountValue),
  min_purchase: promo.minPurchase ? parseFloat(promo.minPurchase) : null,
  max_discount: promo.maxDiscount ? parseFloat(promo.maxDiscount) : null,
  usage_limit: promo.usageLimit,
  usage_count: promo.usageCount,
  start_date: promo.startDate,
  end_date: promo.endDate,
  enabled: promo.enabled,
  created_at: promo.createdAt,
  updated_at: promo.updatedAt
});

// Validate promo code (public - for checkout)
router.post('/validate', async (req, res) => {
  try {
    const { code, price } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promo) {
      return res.status(404).json({ error: 'Kode promo tidak ditemukan' });
    }

    if (!promo.enabled) {
      return res.status(400).json({ error: 'Kode promo tidak aktif' });
    }

    // Check date validity
    const now = new Date();
    if (promo.startDate && now < new Date(promo.startDate)) {
      return res.status(400).json({ error: 'Kode promo belum berlaku' });
    }
    if (promo.endDate && now > new Date(promo.endDate)) {
      return res.status(400).json({ error: 'Kode promo sudah kadaluarsa' });
    }

    // Check usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ error: 'Kode promo sudah mencapai batas penggunaan' });
    }

    // Check minimum purchase
    const priceNum = parseFloat(price) || 0;
    if (promo.minPurchase && priceNum < parseFloat(promo.minPurchase)) {
      return res.status(400).json({ 
        error: `Minimum pembelian Rp ${Number(promo.minPurchase).toLocaleString('id-ID')} untuk kode ini` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = (priceNum * parseFloat(promo.discountValue)) / 100;
      // Apply max discount cap if set
      if (promo.maxDiscount && discountAmount > parseFloat(promo.maxDiscount)) {
        discountAmount = parseFloat(promo.maxDiscount);
      }
    } else {
      // Fixed discount
      discountAmount = parseFloat(promo.discountValue);
    }

    // Ensure discount doesn't exceed price
    if (discountAmount > priceNum) {
      discountAmount = priceNum;
    }

    const finalPrice = priceNum - discountAmount;

    res.json({
      valid: true,
      code: promo.code,
      discount_type: promo.discountType,
      discount_value: parseFloat(promo.discountValue),
      discount_amount: discountAmount,
      original_price: priceNum,
      final_price: finalPrice,
      message: `Diskon ${promo.discountType === 'percentage' ? promo.discountValue + '%' : 'Rp ' + Number(promo.discountValue).toLocaleString('id-ID')} berhasil diterapkan!`
    });
  } catch (error) {
    console.error('Error validating promo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all promo codes (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(promos.map(transformPromo));
  } catch (error) {
    console.error('Error fetching promos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single promo code (admin only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const promo = await prisma.promoCode.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json(transformPromo(promo));
  } catch (error) {
    console.error('Error fetching promo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create promo code (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      code, discount_type, discount_value, 
      min_purchase, max_discount, usage_limit,
      start_date, end_date, enabled 
    } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'Discount type must be "percentage" or "fixed"' });
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountType: discount_type,
        discountValue: parseFloat(discount_value),
        minPurchase: min_purchase ? parseFloat(min_purchase) : null,
        maxDiscount: max_discount ? parseFloat(max_discount) : null,
        usageLimit: usage_limit ? parseInt(usage_limit) : null,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        enabled: enabled !== false
      }
    });

    res.status(201).json(transformPromo(promo));
  } catch (error) {
    console.error('Error creating promo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update promo code (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      code, discount_type, discount_value, 
      min_purchase, max_discount, usage_limit,
      start_date, end_date, enabled 
    } = req.body;

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Check for duplicate code (excluding current)
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }
    }

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase() : existing.code,
        discountType: discount_type || existing.discountType,
        discountValue: discount_value !== undefined ? parseFloat(discount_value) : existing.discountValue,
        minPurchase: min_purchase !== undefined ? (min_purchase ? parseFloat(min_purchase) : null) : existing.minPurchase,
        maxDiscount: max_discount !== undefined ? (max_discount ? parseFloat(max_discount) : null) : existing.maxDiscount,
        usageLimit: usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit) : null) : existing.usageLimit,
        startDate: start_date !== undefined ? (start_date ? new Date(start_date) : null) : existing.startDate,
        endDate: end_date !== undefined ? (end_date ? new Date(end_date) : null) : existing.endDate,
        enabled: enabled !== undefined ? enabled : existing.enabled
      }
    });

    res.json(transformPromo(promo));
  } catch (error) {
    console.error('Error updating promo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Patch promo code (admin only)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    const updateData = {};

    if (req.body.code !== undefined) {
      const newCode = req.body.code.toUpperCase();
      if (newCode !== existing.code) {
        const duplicate = await prisma.promoCode.findUnique({ where: { code: newCode } });
        if (duplicate) {
          return res.status(400).json({ error: 'Promo code already exists' });
        }
      }
      updateData.code = newCode;
    }
    if (req.body.discount_type !== undefined) updateData.discountType = req.body.discount_type;
    if (req.body.discount_value !== undefined) updateData.discountValue = parseFloat(req.body.discount_value);
    if (req.body.min_purchase !== undefined) updateData.minPurchase = req.body.min_purchase ? parseFloat(req.body.min_purchase) : null;
    if (req.body.max_discount !== undefined) updateData.maxDiscount = req.body.max_discount ? parseFloat(req.body.max_discount) : null;
    if (req.body.usage_limit !== undefined) updateData.usageLimit = req.body.usage_limit ? parseInt(req.body.usage_limit) : null;
    if (req.body.start_date !== undefined) updateData.startDate = req.body.start_date ? new Date(req.body.start_date) : null;
    if (req.body.end_date !== undefined) updateData.endDate = req.body.end_date ? new Date(req.body.end_date) : null;
    if (req.body.enabled !== undefined) updateData.enabled = req.body.enabled;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const promo = await prisma.promoCode.update({
      where: { id },
      data: updateData
    });

    res.json(transformPromo(promo));
  } catch (error) {
    console.error('Error patching promo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete promo code (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await prisma.promoCode.delete({ where: { id } });

    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Increment usage count (internal use after order)
export const incrementPromoUsage = async (code) => {
  try {
    await prisma.promoCode.update({
      where: { code: code.toUpperCase() },
      data: { usageCount: { increment: 1 } }
    });
  } catch (error) {
    console.error('Error incrementing promo usage:', error);
  }
};

export default router;
