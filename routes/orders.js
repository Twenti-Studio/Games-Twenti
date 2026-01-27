import express from 'express';
import prisma from '../database/prisma.js';
import { requireAuth } from './auth.js';
import { sendOrderNotificationToAdmin, sendDeliveryEmailToCustomer, initEmailTransporter } from '../services/email.js';
import { incrementPromoUsage } from './promo.js';

const router = express.Router();

// Initialize email on server start
const initEmail = async () => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    initEmailTransporter(settingsObj);
  } catch (error) {
    console.log('Email init skipped - database not ready yet');
  }
};
initEmail();

// Helper to transform Prisma order to snake_case for frontend compatibility
const transformOrder = (order) => ({
  id: order.id,
  product_id: order.productId,
  package_id: order.packageId,
  product_name: order.productName,
  category_name: order.categoryName,
  package_name: order.packageName,
  price: parseFloat(order.price),
  original_price: order.originalPrice ? parseFloat(order.originalPrice) : null,
  discount_amount: order.discountAmount ? parseFloat(order.discountAmount) : null,
  promo_code: order.promoCode,
  user_data: order.userData,
  payment_proof: order.paymentProof,
  status: order.status,
  created_at: order.createdAt
});

// Create order (public - from checkout)
router.post('/', async (req, res) => {
  try {
    const { product_id, package_id, user_data, payment_proof, promo_code, discount_amount, final_price } = req.body;
    
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

    // Calculate final price (verify promo if provided)
    let orderPrice = pkg.price;
    let originalPrice = null;
    let discountAmountFinal = null;
    let appliedPromoCode = null;

    if (promo_code && discount_amount) {
      // Verify the promo code is still valid
      const promo = await prisma.promoCode.findUnique({
        where: { code: promo_code.toUpperCase() }
      });

      if (promo && promo.enabled) {
        const now = new Date();
        const isValid = 
          (!promo.startDate || now >= new Date(promo.startDate)) &&
          (!promo.endDate || now <= new Date(promo.endDate)) &&
          (!promo.usageLimit || promo.usageCount < promo.usageLimit) &&
          (!promo.minPurchase || parseFloat(pkg.price) >= parseFloat(promo.minPurchase));

        if (isValid) {
          originalPrice = pkg.price;
          discountAmountFinal = parseFloat(discount_amount);
          orderPrice = parseFloat(final_price) || (parseFloat(pkg.price) - discountAmountFinal);
          appliedPromoCode = promo_code.toUpperCase();
          
          // Increment usage count
          await incrementPromoUsage(appliedPromoCode);
        }
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId: productIdInt,
        packageId: packageIdInt,
        productName: product.name,
        categoryName: product.category.name,
        packageName: pkg.name,
        price: orderPrice,
        originalPrice: originalPrice,
        discountAmount: discountAmountFinal,
        promoCode: appliedPromoCode,
        userData: user_data,
        paymentProof: payment_proof || null,
        status: 'pending'
      }
    });

    // Send email notification to admin
    try {
      const settings = await prisma.setting.findMany();
      const settingsObj = {};
      settings.forEach(s => { settingsObj[s.key] = s.value; });
      
      // Make sure email is initialized with latest settings
      initEmailTransporter(settingsObj);
      
      await sendOrderNotificationToAdmin({
        id: order.id,
        productName: order.productName,
        categoryName: order.categoryName,
        packageName: order.packageName,
        price: order.price,
        originalPrice: order.originalPrice,
        discountAmount: order.discountAmount,
        promoCode: order.promoCode,
        userData: order.userData,
        paymentProof: order.paymentProof,
        createdAt: order.createdAt
      }, settingsObj);
    } catch (emailError) {
      console.error('Failed to send order notification email:', emailError);
      // Don't fail the order if email fails
    }

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

    const existing = await prisma.order.findUnique({ 
      where: { id },
      include: { package: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status }
    });

    // If status changed to 'completed' and package has download URL, send delivery email
    if (status === 'completed' && existing.package?.downloadUrl) {
      try {
        const settings = await prisma.setting.findMany();
        const settingsObj = {};
        settings.forEach(s => { settingsObj[s.key] = s.value; });
        
        initEmailTransporter(settingsObj);
        
        await sendDeliveryEmailToCustomer({
          id: updated.id,
          productName: updated.productName,
          packageName: updated.packageName,
          userData: updated.userData,
          createdAt: updated.createdAt
        }, existing.package.downloadUrl, settingsObj);
      } catch (emailError) {
        console.error('Failed to send delivery email:', emailError);
      }
    }

    res.json(transformOrder(updated));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partial update order (admin only) - PATCH
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Build update data only with provided fields
    const updateData = {};

    if (req.body.status !== undefined) {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updateData.status = req.body.status;
    }
    if (req.body.payment_proof !== undefined) {
      updateData.paymentProof = req.body.payment_proof;
    }
    if (req.body.user_data !== undefined) {
      updateData.userData = req.body.user_data;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData
    });

    res.json(transformOrder(updated));
  } catch (error) {
    console.error('Error patching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;