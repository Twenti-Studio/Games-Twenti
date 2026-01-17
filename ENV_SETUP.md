# Environment Configuration

## Setup .env File

Buat file `.env` di root project dengan mengcopy dari `.env.example`:

```bash
cp .env.example .env
```

Atau buat manual file `.env` dengan isi berikut:

```env
# Server Configuration
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
```

## Environment Variables

### Server Configuration
- `PORT`: Port untuk server Express (default: 3000)
- `NODE_ENV`: Environment mode (`development` atau `production`)

### Client Configuration
- `CLIENT_URL`: URL frontend untuk CORS (default: http://localhost:5173)

### Security
- `SESSION_SECRET`: Secret key untuk session encryption (WAJIB diubah di production!)

### Database Configuration
- `DB_PATH`: Path ke database SQLite file (default: ./database/marketplace.db)
- `DB_AUTO_INIT`: Otomatis membuat database dan table jika belum ada (default: true)

### Admin Credentials
- `ADMIN_USERNAME`: Username default untuk admin (default: admin)
- `ADMIN_PASSWORD`: Password default untuk admin (default: admin123)

## Database Auto-Initialization

Database akan otomatis dibuat dan diinisialisasi saat pertama kali server dijalankan jika:
- File database belum ada
- `DB_AUTO_INIT=true` (default)

Database akan otomatis membuat:
- Semua table yang diperlukan
- Default admin user
- Default categories (Game, Digital Subscription, Social Media Services)
- Default settings (WhatsApp number, message template)

## Production Setup

Untuk production, pastikan:
1. Ubah `SESSION_SECRET` ke random string yang kuat
2. Ubah `NODE_ENV=production`
3. Ubah `ADMIN_USERNAME` dan `ADMIN_PASSWORD` ke credentials yang aman
4. Set `CLIENT_URL` ke domain production Anda
