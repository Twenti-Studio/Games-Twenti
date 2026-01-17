import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initDatabase() {
  // Get database path from environment or use default
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'marketplace.db');
  const dbFullPath = dbPath.startsWith('./') || dbPath.startsWith('../') 
    ? path.join(process.cwd(), dbPath) 
    : dbPath;
  
  console.log(`Initializing database at: ${dbFullPath}`);
  db = new Database(dbFullPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      service_type TEXT NOT NULL,
      input_fields TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      category_name TEXT NOT NULL,
      package_name TEXT NOT NULL,
      price REAL NOT NULL,
      user_data TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default admin user from environment or use defaults
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(adminUsername);
  if (!adminExists) {
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(adminUsername, passwordHash);
    console.log(`Default admin user created: ${adminUsername}`);
  }

  // Insert default categories
  const categories = [
    { name: 'Game', slug: 'game', description: 'Game top-up services', icon: '🎮' },
    { name: 'Digital Subscription', slug: 'digital-subscription', description: 'Digital subscription services', icon: '📺' },
    { name: 'Social Media Services', slug: 'social-media-services', description: 'Social media growth services', icon: '📱' }
  ];

  categories.forEach(cat => {
    const exists = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug);
    if (!exists) {
      db.prepare('INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)')
        .run(cat.name, cat.slug, cat.description, cat.icon);
    }
  });

  // Insert default WhatsApp setting
  const whatsappExists = db.prepare('SELECT key FROM settings WHERE key = ?').get('whatsapp_number');
  if (!whatsappExists) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('whatsapp_number', '6281234567890');
  }

  const messageTemplateExists = db.prepare('SELECT key FROM settings WHERE key = ?').get('checkout_message_template');
  if (!messageTemplateExists) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
      .run('checkout_message_template', 'Halo! Saya ingin membeli:\n\n*Produk:* {product_name}\n*Kategori:* {category_name}\n*Paket:* {package_name}\n*Harga:* Rp {price}\n\n*Data yang diperlukan:*\n{user_data}\n\n*Waktu Pemesanan:* {order_time}');
  }

  return db;
}

export function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}
