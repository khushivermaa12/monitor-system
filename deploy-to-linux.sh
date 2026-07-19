#!/usr/bin/env bash

set -e
set -u

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

info "Verifying project structure..."

if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    error "Must run from project root. Expected Backend/ and Frontend/ directories."
fi

if [ ! -f "nginx-production.conf" ]; then
    error "nginx-production.conf not found. Run from the project root directory."
fi

success "Project structure verified."

info "Building React frontend..."

cd Frontend

if [ ! -f "package.json" ]; then
    error "Frontend/package.json not found."
fi

npm install --silent
info "Running npm run build..."
npm run build

if [ ! -f "dist/index.html" ]; then
    error "Build failed — dist/index.html not found."
fi

success "Frontend built successfully."
cd ..

info "Installing Nginx..."

if command -v nginx &>/dev/null; then
    warn "Nginx already installed: $(nginx -v 2>&1). Skipping install."
else
    sudo apt-get update -qq
    sudo apt-get install -y nginx
    success "Nginx installed."
fi

sudo systemctl enable nginx

info "Checking Node.js installation..."

if command -v node &>/dev/null; then
    warn "Node.js already installed: $(node --version). Skipping."
else
    info "Installing Node.js via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    success "Node.js installed: $(node --version)"
fi

info "Creating deployment directories..."

sudo mkdir -p /var/www/abawat-maintenance/dist
sudo mkdir -p /var/www/abawat-backend
sudo chown -R "$USER":"$USER" /var/www/abawat-maintenance
sudo chown -R "$USER":"$USER" /var/www/abawat-backend

success "Directories created."

info "Deploying React build files to /var/www/abawat-maintenance/dist/..."

if command -v rsync &>/dev/null; then
    rsync -av --delete Frontend/dist/ /var/www/abawat-maintenance/dist/
else
    rm -rf /var/www/abawat-maintenance/dist/*
    cp -r Frontend/dist/. /var/www/abawat-maintenance/dist/
fi

if [ ! -f "/var/www/abawat-maintenance/dist/index.html" ]; then
    error "Frontend deployment failed — /var/www/abawat-maintenance/dist/index.html missing."
fi

success "React build deployed."

info "Deploying backend to /var/www/abawat-backend/..."

if command -v rsync &>/dev/null; then
    rsync -av --delete --exclude='node_modules' --exclude='.env' Backend/ /var/www/abawat-backend/
else
    find Backend/ -maxdepth 1 -not -name 'node_modules' -not -name '.env' -exec cp -r {} /var/www/abawat-backend/ \;
fi

info "Installing backend Node.js dependencies..."
cd /var/www/abawat-backend
npm install --omit=dev --silent
cd -

success "Backend deployed."

if [ -f "Backend/.env" ]; then
    info "Copying .env file..."
    cp Backend/.env /var/www/abawat-backend/.env
    chmod 600 /var/www/abawat-backend/.env
    success ".env copied."
else
    warn ".env file not found in Backend/. You must manually create /var/www/abawat-backend/.env before starting Node."
fi

info "Installing Nginx configuration..."

sudo cp nginx-production.conf /etc/nginx/sites-available/abawat
sudo ln -sf /etc/nginx/sites-available/abawat /etc/nginx/sites-enabled/abawat

if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    warn "Removed default Nginx site config."
fi

success "Nginx config installed and enabled."

info "Testing Nginx configuration..."

if sudo nginx -t; then
    success "Nginx config syntax is valid."
else
    error "Nginx config has syntax errors. Fix nginx-production.conf and re-run."
fi

info "Reloading Nginx..."

if sudo systemctl is-active --quiet nginx; then
    sudo nginx -s reload
    success "Nginx reloaded with new configuration."
else
    sudo systemctl start nginx
    success "Nginx started."
fi

info "Installing PM2..."

if command -v pm2 &>/dev/null; then
    warn "PM2 already installed: $(pm2 --version). Skipping."
else
    sudo npm install -g pm2
    success "PM2 installed."
fi

info "Starting Node.js backend with PM2..."

cd /var/www/abawat-backend

if pm2 describe abawat-backend &>/dev/null; then
    warn "abawat-backend already running in PM2. Restarting..."
    pm2 restart abawat-backend
else
    pm2 start server.js --name "abawat-backend" --env production
fi

pm2 save

cd -

success "Backend started with PM2."

info "Configuring PM2 startup..."

PM2_STARTUP=$(pm2 startup 2>&1 | grep "sudo" | tail -1)

if [ -n "$PM2_STARTUP" ]; then
    info "Running PM2 startup command: $PM2_STARTUP"
    eval "$PM2_STARTUP"
    success "PM2 configured to start on boot."
else
    warn "Could not auto-configure PM2 startup. Run 'pm2 startup' manually."
fi

echo ""
echo "============================================================"
echo -e "${GREEN}  DEPLOYMENT COMPLETE${NC}"
echo "============================================================"
echo ""
info "Verification checks:"

if sudo systemctl is-active --quiet nginx; then
    success "Nginx is running"
else
    error "Nginx is NOT running"
fi

if pm2 describe abawat-backend &>/dev/null; then
    success "Backend (abawat-backend) is running via PM2"
else
    warn "Backend may not be running. Check: pm2 list"
fi

if sudo ss -tlnp | grep -q ':80 '; then
    success "Port 80 is listening"
else
    warn "Port 80 may not be listening. Check: sudo ss -tlnp | grep 80"
fi

echo ""
info "Useful commands:"
echo "  View backend logs:     pm2 logs abawat-backend"
echo "  Restart backend:       pm2 restart abawat-backend"
echo "  Stop backend:          pm2 stop abawat-backend"
echo "  View PM2 status:       pm2 list"
echo "  View Nginx logs:       sudo tail -f /var/log/nginx/abawat-error.log"
echo "  Test Nginx fallback:   pm2 stop abawat-backend && curl http://localhost/"
echo ""
success "Deployment script complete. Edit /var/www/abawat-backend/.env if not done yet."