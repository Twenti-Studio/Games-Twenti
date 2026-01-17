import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      passwordHash: hashedPassword
    }
  });

  // Seed categories
  const categories = [
    { name: 'Game', slug: 'game', description: 'Game top-up services', icon: '🎮' },
    { name: 'Digital Subscription', slug: 'digital-subscription', description: 'Digital subscription services', icon: '📺' },
    { name: 'Social Media Services', slug: 'social-media-services', description: 'Social media growth services', icon: '📱' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }

  // Seed settings
  await prisma.setting.upsert({
    where: { key: 'whatsapp_number' },
    update: {},
    create: { key: 'whatsapp_number', value: '6281234567890' }
  });

  await prisma.setting.upsert({
    where: { key: 'checkout_message_template' },
    update: {},
    create: { 
      key: 'checkout_message_template', 
      value: 'Halo! Saya ingin membeli:\n\n*Produk:* {product_name}\n*Kategori:* {category_name}\n*Paket:* {package_name}\n*Harga:* Rp {price}' 
    }
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });