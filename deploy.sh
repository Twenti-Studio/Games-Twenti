#!/bin/bash
# =============================================================
# Game Twenti - VPS Deployment Script
# =============================================================
# Script ini digunakan untuk deploy dan update aplikasi.
# Database TIDAK akan dihapus saat update.
# 
# Penggunaan:
#   Pertama kali:  ./deploy.sh --init
#   Update:        ./deploy.sh
#   Force rebuild: ./deploy.sh --rebuild
# =============================================================

set -e

# ===================== CONFIGURATION =====================
APP_DIR="/opt/gametwenti"
REPO_URL="https://github.com/Twenti-Studio/Games-Twenti.git"
BRANCH="main"
DOMAIN="games.twenti.studio" 
# =========================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# ===================== FUNCTIONS =====================

# Install system dependencies (first time only)
install_dependencies() {
    log_info "Installing system dependencies..."
    
    # Update system
    apt-get update -y
    
    # Install Docker if not exists
    if ! command -v docker &> /dev/null; then
        log_info "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
        log_success "Docker installed"
    else
        log_success "Docker already installed"
    fi
    
    # Install Docker Compose plugin if not exists
    if ! docker compose version &> /dev/null; then
        log_info "Installing Docker Compose..."
        apt-get install -y docker-compose-plugin
        log_success "Docker Compose installed"
    else
        log_success "Docker Compose already installed"
    fi
    
    # Install Nginx if not exists
    if ! command -v nginx &> /dev/null; then
        log_info "Installing Nginx..."
        apt-get install -y nginx
        systemctl enable nginx
        log_success "Nginx installed"
    else
        log_success "Nginx already installed"
    fi
    
    # Install Certbot for SSL
    if ! command -v certbot &> /dev/null; then
        log_info "Installing Certbot..."
        apt-get install -y certbot python3-certbot-nginx
        log_success "Certbot installed"
    else
        log_success "Certbot already installed"
    fi
    
    # Install Git if not exists
    if ! command -v git &> /dev/null; then
        log_info "Installing Git..."
        apt-get install -y git
        log_success "Git installed"
    else
        log_success "Git already installed"
    fi
}

# Setup nginx configuration
setup_nginx() {
    log_info "Setting up Nginx..."
    
    # Copy nginx config
    cp "$APP_DIR/nginx/gametwenti.conf" /etc/nginx/sites-available/gametwenti
    
    # Replace domain in nginx config
    sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/gametwenti
    
    # Enable site
    ln -sf /etc/nginx/sites-available/gametwenti /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx config (temporarily comment out SSL for first run)
    # Create a temporary HTTP-only config for certbot
    cat > /etc/nginx/sites-available/gametwenti-temp << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Use temp config first
    ln -sf /etc/nginx/sites-available/gametwenti-temp /etc/nginx/sites-enabled/gametwenti
    
    nginx -t && systemctl reload nginx
    log_success "Nginx configured (HTTP)"
}

# Setup SSL with Certbot
setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || {
        log_warn "SSL setup failed. You can retry later with:"
        log_warn "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        return 0
    }
    
    # Now use the full nginx config with SSL
    cp "$APP_DIR/nginx/gametwenti.conf" /etc/nginx/sites-available/gametwenti
    sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/gametwenti
    ln -sf /etc/nginx/sites-available/gametwenti /etc/nginx/sites-enabled/gametwenti
    rm -f /etc/nginx/sites-available/gametwenti-temp
    
    nginx -t && systemctl reload nginx
    log_success "SSL certificate installed"
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -
    log_success "SSL auto-renewal configured"
}

# Setup environment file
setup_env() {
    if [ ! -f "$APP_DIR/.env.production" ]; then
        log_info "Creating .env.production from template..."
        cp "$APP_DIR/.env.example" "$APP_DIR/.env.production"
        
        # Generate a random session secret
        SESSION_SECRET=$(openssl rand -base64 48)
        sed -i "s|your-super-secret-session-key-change-in-production|$SESSION_SECRET|g" "$APP_DIR/.env.production"
        
        # Generate a random db password
        DB_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')
        sed -i "s|your-strong-db-password-here|$DB_PASSWORD|g" "$APP_DIR/.env.production"
        
        # Set domain
        sed -i "s|yourdomain.com|$DOMAIN|g" "$APP_DIR/.env.production"
        
        log_warn "=================================================="
        log_warn "  PENTING: Edit file .env.production!"
        log_warn "  $APP_DIR/.env.production"
        log_warn "  "
        log_warn "  Yang perlu diubah:"
        log_warn "  - ADMIN_PASSWORD"
        log_warn "  - SMTP_USER & SMTP_PASS (untuk email)"
        log_warn "  - Cek credential database yang digenerate"
        log_warn "=================================================="
        
        read -p "Tekan Enter setelah selesai mengedit .env.production (atau Ctrl+C untuk batal)..."
    else
        log_success ".env.production sudah ada (tidak diubah)"
    fi
}

# First time initialization
init_deploy() {
    log_info "=========================================="
    log_info "  Game Twenti - First Time Setup"
    log_info "=========================================="
    
    # Install dependencies
    install_dependencies
    
    # Clone repository
    if [ ! -d "$APP_DIR/.git" ]; then
        log_info "Cloning repository..."
        git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
        log_success "Repository cloned"
    else
        log_success "Repository already exists"
        cd "$APP_DIR"
        git fetch origin
        git reset --hard "origin/$BRANCH"
        log_success "Repository updated"
    fi
    
    cd "$APP_DIR"
    
    # Setup environment
    setup_env
    
    # Build and start containers
    log_info "Building and starting Docker containers..."
    docker compose build --no-cache
    docker compose up -d
    log_success "Containers started"
    
    # Wait for app to be healthy
    log_info "Waiting for application to start..."
    sleep 15
    
    # Check health
    if curl -s http://localhost:3001/health | grep -q '"status":"ok"'; then
        log_success "Application is healthy!"
    else
        log_warn "Application may still be starting, check with: docker compose logs -f app"
    fi
    
    # Setup Nginx
    setup_nginx
    
    # Setup SSL
    read -p "Setup SSL sekarang? (y/n): " setup_ssl_now
    if [ "$setup_ssl_now" = "y" ] || [ "$setup_ssl_now" = "Y" ]; then
        setup_ssl
    else
        log_warn "SSL belum disetup. Jalankan nanti dengan: certbot --nginx -d $DOMAIN"
    fi
    
    log_success "=========================================="
    log_success "  Deployment selesai!"
    log_success "  App: http://$DOMAIN"
    log_success "  Admin: http://$DOMAIN/admin/login"
    log_success "=========================================="
}

# Update deployment (preserves database!)
update_deploy() {
    log_info "=========================================="
    log_info "  Game Twenti - Updating..."
    log_info "=========================================="
    
    cd "$APP_DIR"
    
    # Pull latest code from main branch
    log_info "Pulling latest code from $BRANCH..."
    git fetch origin
    git reset --hard "origin/$BRANCH"
    log_success "Code updated"
    
    # Rebuild and restart (database volume is NOT affected)
    log_info "Rebuilding application..."
    docker compose build --no-cache
    
    # Restart with zero downtime approach
    log_info "Restarting application..."
    docker compose up -d --force-recreate app
    log_success "Application restarted"
    
    # Wait and check health
    log_info "Waiting for application to be healthy..."
    sleep 15
    
    if curl -s http://localhost:3001/health | grep -q '"status":"ok"'; then
        log_success "Application is healthy!"
    else
        log_warn "Application may still be starting..."
        log_warn "Check logs: docker compose logs -f app"
    fi
    
    # Reload nginx (in case config changed)
    if [ -f /etc/nginx/sites-available/gametwenti ]; then
        cp "$APP_DIR/nginx/gametwenti.conf" /etc/nginx/sites-available/gametwenti
        sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/gametwenti
        nginx -t 2>/dev/null && systemctl reload nginx
    fi
    
    # Cleanup old Docker images to save disk space
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    
    log_success "=========================================="
    log_success "  Update complete!"
    log_success "  Database: PRESERVED (tidak dihapus)"
    log_success "  Uploads: PRESERVED (tidak dihapus)"
    log_success "=========================================="
}

# Force rebuild
force_rebuild() {
    log_info "Force rebuilding all containers..."
    cd "$APP_DIR"
    
    git fetch origin
    git reset --hard "origin/$BRANCH"
    
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    
    sleep 15
    
    if curl -s http://localhost:3001/health | grep -q '"status":"ok"'; then
        log_success "Application is healthy after rebuild!"
    else
        log_warn "Check logs: docker compose logs -f"
    fi
    
    log_success "Force rebuild complete! Database preserved."
}

# Show status
show_status() {
    echo ""
    log_info "=== Container Status ==="
    cd "$APP_DIR"
    docker compose ps
    echo ""
    log_info "=== Health Check ==="
    curl -s http://localhost:3001/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "App not responding"
    echo ""
    log_info "=== Disk Usage ==="
    docker system df
    echo ""
}

# Show logs
show_logs() {
    cd "$APP_DIR"
    docker compose logs -f --tail=100
}

# ===================== MAIN =====================

case "${1:-}" in
    --init)
        init_deploy
        ;;
    --rebuild)
        force_rebuild
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs
        ;;
    --help)
        echo "Usage: ./deploy.sh [option]"
        echo ""
        echo "Options:"
        echo "  (no option)    Update deployment (pull code, rebuild, restart)"
        echo "  --init         First time setup (install deps, clone, build)"
        echo "  --rebuild      Force rebuild all containers"
        echo "  --status       Show container status"
        echo "  --logs         Show application logs"
        echo "  --help         Show this help"
        echo ""
        echo "PENTING: Database dan uploads TIDAK akan dihapus saat update!"
        ;;
    "")
        update_deploy
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
