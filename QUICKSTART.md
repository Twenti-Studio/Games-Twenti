# Quick Start Guide

## For Replit Users

1. **Click "Run"** - Replit will automatically install dependencies and start the server
2. **Wait for installation** - First run may take a minute to install all packages
3. **Access the app** - Use the Replit webview URL

## Manual Setup

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Start Development Server

```bash
# This runs both backend and frontend
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Step 3: Access Admin Panel

1. Navigate to: http://localhost:5173/admin/login
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### Step 4: Create Your First Product

1. Go to **Categories** → Add a category (e.g., "Game")
2. Go to **Products** → Add a product
   - Select category
   - Enter product name and details
   - Configure input fields (e.g., User ID, Server for game top-ups)
3. Go to **Packages** → Add packages with prices
4. Go to **Settings** → Update WhatsApp number

## Example: Creating a Mobile Legends Top-Up Product

1. **Category**: Game (already exists)
2. **Product**:
   - Name: Mobile Legends Top-Up
   - Service Type: Game Top-Up
   - Input Fields:
     ```json
     [
       {
         "name": "user_id",
         "label": "User ID",
         "type": "text",
         "required": true,
         "placeholder": "Enter your User ID"
       },
       {
         "name": "server",
         "label": "Server",
         "type": "text",
         "required": true,
         "placeholder": "e.g., Asia, Europe"
       }
     ]
     ```
3. **Packages**:
   - Basic: Rp 50,000
   - Premium: Rp 100,000
   - Ultimate: Rp 200,000

## Troubleshooting

### Database Issues
- The database is created automatically on first run
- If you need to reset, delete `database/marketplace.db` and restart

### Port Already in Use
- Change PORT in `.env` or environment variables
- Update CLIENT_URL accordingly

### CORS Errors
- Make sure CLIENT_URL matches your frontend URL
- Check that both server and client are running

## Next Steps

1. Customize the WhatsApp message template in Settings
2. Add your products and packages
3. Test the checkout flow
4. Change the default admin password (manually update in database)
