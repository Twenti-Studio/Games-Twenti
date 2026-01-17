import express from 'express';
import prisma from '../database/prisma.js';

const router = express.Router();

// Get public homepage data
router.get('/homepage', async (req, res) => {
  try {
    // Get all categories with product counts
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { enabled: true },
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const categoriesWithCount = categories.map(c => ({
      ...c,
      product_count: c.products.length,
      products: undefined
    }));

    // Get featured products (first 6 enabled products)
    const featuredProducts = await prisma.product.findMany({
      where: { enabled: true },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const featuredWithCategory = featuredProducts.map(p => ({
      ...p,
      category_name: p.category.name,
      category_slug: p.category.slug,
      category: undefined
    }));

    res.json({
      categories: categoriesWithCount,
      featuredProducts: featuredWithCategory
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment settings (public)
router.get('/payment-settings', async (req, res) => {
  try {
    const bankName = await prisma.setting.findUnique({ where: { key: 'payment_bank_name' } });
    const accountNumber = await prisma.setting.findUnique({ where: { key: 'payment_account_number' } });
    const accountName = await prisma.setting.findUnique({ where: { key: 'payment_account_name' } });
    const qrCode = await prisma.setting.findUnique({ where: { key: 'payment_qr_code' } });

    res.json({
      bank_name: bankName?.value || '',
      account_number: accountNumber?.value || '',
      account_name: accountName?.value || '',
      qr_code: qrCode?.value || ''
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get WhatsApp checkout URL
router.post('/checkout-url', async (req, res) => {
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

    // Get settings
    const whatsappSetting = await prisma.setting.findUnique({
      where: { key: 'whatsapp_number' }
    });
    const templateSetting = await prisma.setting.findUnique({
      where: { key: 'checkout_message_template' }
    });

    const whatsappNumber = whatsappSetting?.value || '6281234567890';
    const messageTemplate = templateSetting?.value || 
      'Halo! Saya ingin membeli:\n\n*Produk:* {product_name}\n*Kategori:* {category_name}\n*Paket:* {package_name}\n*Harga:* Rp {price}\n\n*Data yang diperlukan:*\n{user_data}\n\n{payment_proof}\n\n*Waktu Pemesanan:* {order_time}';

    // Format user data
    const userDataText = Object.entries(user_data)
      .map(([key, value]) => `*${key}:* ${value}`)
      .join('\n');

    // Format order time
    const orderTime = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    // Format payment proof text
    let paymentProofText = '';
    if (payment_proof) {
      paymentProofText = `*Bukti Pembayaran:* ${payment_proof}`;
    }

    // Build message
    const priceNumber = Number(pkg.price);
    let message = messageTemplate
      .replace('{product_name}', product.name)
      .replace('{category_name}', product.category.name)
      .replace('{package_name}', pkg.name)
      .replace('{price}', priceNumber.toLocaleString('id-ID'))
      .replace('{user_data}', userDataText)
      .replace('{payment_proof}', paymentProofText)
      .replace('{order_time}', orderTime);

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    res.json({ url: whatsappUrl });
  } catch (error) {
    console.error('Error generating checkout URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;