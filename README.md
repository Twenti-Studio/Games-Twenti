# GameTwenti - Digital Marketplace MVP

A full-stack web marketplace for digital products and services, focused on game top-ups and social media services. Built to run on Replit.

## Features

### Public Features
- **Landing Page**: Showcase categories and featured products
- **Product Catalog**: Browse products by category or view all products
- **Product Detail Page**: View product information, select packages, and fill dynamic forms
- **WhatsApp Checkout**: Automatic redirect to WhatsApp with formatted order message

### Admin CMS Features
- **Authentication**: Secure admin login system
- **Dashboard**: Overview of categories, products, orders, and statistics
- **Category Management**: Create, edit, and delete product categories
- **Product Management**: 
  - Create and manage products
  - Configure dynamic input fields per product
  - Enable/disable products
- **Package Management**: Manage packages for each product with pricing
- **Order History**: View all orders with status management
- **Settings**: Configure WhatsApp number and checkout message template

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Express Sessions
- **Routing**: React Router

## Project Structure

```
game-twenti/
├── server.js                 # Main server file
├── database/
│   └── db.js                # Database initialization and models
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── categories.js        # Category CRUD routes
│   ├── products.js          # Product CRUD routes
│   ├── packages.js          # Package CRUD routes
│   ├── orders.js            # Order management routes
│   ├── settings.js          # Settings routes
│   └── public.js            # Public API routes
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # API utilities
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── package.json
└── package.json
```

## Setup Instructions for Replit

### 1. Initial Setup

1. **Install Dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

2. **Environment Variables** (Required):
   Create a `.env` file in the root directory. You can copy from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Or create manually with these variables:
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
   
   # Admin Default Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```
   
   **Important**: Database akan otomatis dibuat dan diinisialisasi saat pertama kali server dijalankan!

### 2. Running the Application

**Development Mode** (runs both server and client):
```bash
npm run dev
```

**Production Mode** (build client first, then run server):
```bash
cd client && npm run build && cd ..
npm start
```

### 3. Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default admin password after first login!

## API Endpoints

### Public Endpoints
- `GET /api/public/homepage` - Get homepage data
- `GET /api/categories` - Get all categories
- `GET /api/products` - Get all enabled products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/packages/product/:productId` - Get packages for product
- `POST /api/public/checkout-url` - Generate WhatsApp checkout URL
- `POST /api/orders` - Create new order

### Admin Endpoints (Requires Authentication)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Check auth status
- `GET /api/categories` - Get all categories (admin)
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/products/admin` - Get all products (including disabled)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/packages/product/:productId/admin` - Get all packages (admin)
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting

## Product Input Fields Configuration

When creating a product, you can configure dynamic input fields. Each field has:
- `name`: Field identifier (e.g., "user_id")
- `label`: Display label (e.g., "User ID")
- `type`: Input type (text, email, number, textarea)
- `required`: Boolean for required fields
- `placeholder`: Placeholder text
- `help`: Help text shown below the field

Example input fields for Game Top-Up:
```json
[
  {
    "name": "user_id",
    "label": "User ID",
    "type": "text",
    "required": true,
    "placeholder": "Enter your User ID",
    "help": "Your in-game user ID"
  },
  {
    "name": "server",
    "label": "Server",
    "type": "text",
    "required": true,
    "placeholder": "e.g., Asia, Europe",
    "help": "Select your game server"
  }
]
```

## WhatsApp Checkout

The checkout system automatically:
1. Creates an order record in the database
2. Generates a formatted WhatsApp message using the template
3. Redirects user to WhatsApp with the pre-filled message

Message template placeholders:
- `{product_name}` - Product name
- `{category_name}` - Category name
- `{package_name}` - Selected package name
- `{price}` - Package price (formatted)
- `{user_data}` - User input data (formatted)
- `{order_time}` - Order timestamp

## Database

The application uses SQLite database stored in `database/marketplace.db`. The database is automatically initialized on first run with:
- Default categories (Game, Digital Subscription, Social Media Services)
- Default admin user
- Default settings

## Deployment on Replit

1. **Fork this repository** to your Replit account
2. **Open in Replit** - The `.replit` file will configure the environment
3. **Run the application** - Click "Run" or use `npm run dev`
4. **Access the app** - Use the Replit webview URL

For production deployment:
1. Build the client: `cd client && npm run build`
2. Set `NODE_ENV=production` in environment variables
3. The server will serve the built React app

## Development Notes

- The database file (`database/marketplace.db`) is created automatically
- Session secret should be changed in production
- CORS is configured for the client URL
- All admin routes require authentication via session

## License

This project is an MVP for demonstration purposes.
