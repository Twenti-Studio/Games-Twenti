import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envExample = `# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:5173

# Session Secret (Change this in production!)
SESSION_SECRET=your-secret-key-change-in-production-12345

# Database Configuration
DB_PATH=./database/marketplace.db
DB_AUTO_INIT=true

# Admin Default Credentials (Change after first login!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ File .env berhasil dibuat!');
  console.log('📝 Silakan edit file .env jika perlu mengubah konfigurasi.');
} else {
  console.log('⚠️  File .env sudah ada. Tidak perlu dibuat ulang.');
  console.log('📝 Edit file .env jika perlu mengubah konfigurasi.');
}
