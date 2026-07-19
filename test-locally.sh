#!/usr/bin/env bash
# =============================================================================
# test-locally.sh — Abawat Maintenance System — Local Fallback Testing Script
# =============================================================================
# Usage:
#   chmod +x test-locally.sh
#   ./test-locally.sh
#
# Purpose:
#   Lets you test the Nginx fallback behavior on your local machine
#   WITHOUT needing a Linux server. Works on macOS or Linux.
#
# What it tests:
#   - React build is working
#   - Static files serve correctly
#   - When Node goes down, maintenance page appears
#   - When Node comes back, polling detects it
#
# This script is IDEMPOTENT — safe to run multiple times.
# =============================================================================

set -e
set -u

# ---------------------------------------------------------------------------
# Color output
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}==>${NC} $1"; }

# ---------------------------------------------------------------------------
# Step 0: Verify project structure
# ---------------------------------------------------------------------------
step "Verifying project structure..."

if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    error "Must run from project root. Expected Backend/ and Frontend/ directories."
fi

success "Project structure verified."

# ---------------------------------------------------------------------------
# Step 1: Check prerequisites
# ---------------------------------------------------------------------------
step "Checking prerequisites..."

# Check Node.js
if ! command -v node &>/dev/null; then
    error "Node.js is not installed. Install it from https://nodejs.org/"
fi
success "Node.js: $(node --version)"

# Check npm
if ! command -v npm &>/dev/null; then
    error "npm is not installed."
fi
success "npm: $(npm --version)"

# ---------------------------------------------------------------------------
# Step 2: Install frontend dependencies and build
# ---------------------------------------------------------------------------
step "Installing frontend dependencies..."

cd Frontend

if [ ! -f "package.json" ]; then
    error "Frontend/package.json not found."
fi

npm install --silent
success "Frontend dependencies installed."

step "Building React frontend..."
npm run build

if [ ! -f "dist/index.html" ]; then
    error "Build failed — dist/index.html not found."
fi

success "React frontend built successfully."
ls -lh dist/
cd ..

# ---------------------------------------------------------------------------
# Step 3: Set up test directory
# ---------------------------------------------------------------------------
step "Setting up test directory..."

TEST_DIR="/tmp/abawat-test"

# Create test directory
mkdir -p "$TEST_DIR/dist"

# Copy React build to test directory
if command -v rsync &>/dev/null; then
    rsync -a --delete Frontend/dist/ "$TEST_DIR/dist/"
else
    rm -rf "$TEST_DIR/dist"
    cp -r Frontend/dist "$TEST_DIR/"
fi

success "Test files copied to $TEST_DIR/"

# ---------------------------------------------------------------------------
# Step 4: Detect static file server
# ---------------------------------------------------------------------------
step "Detecting static file server..."

STATIC_SERVER=""
STATIC_PORT=8080

# Option A: Nginx (best — full fallback testing)
if command -v nginx &>/dev/null; then
    STATIC_SERVER="nginx"
    success "Found: nginx $(nginx -v 2>&1 | grep -oP '\d+\.\d+\.\d+')"

# Option B: http-server (Node.js package — good for basic testing)
elif command -v http-server &>/dev/null; then
    STATIC_SERVER="http-server"
    success "Found: http-server"

# Option C: Python HTTP server (built-in — limited, no fallback to index.html)
elif command -v python3 &>/dev/null; then
    STATIC_SERVER="python3"
    warn "Only Python3 available. SPA routing won't work, but files will serve."

else
    warn "No static file server found."
    info "Install one with: npm install -g http-server"
    info "Or install Nginx: brew install nginx (macOS) / sudo apt install nginx (Linux)"
fi

# ---------------------------------------------------------------------------
# Step 5: Start static file server
# ---------------------------------------------------------------------------
step "Starting static file server..."

STATIC_PID=""

if [ "$STATIC_SERVER" = "nginx" ]; then
    # Create a minimal local Nginx config
    LOCAL_NGINX_CONF="$TEST_DIR/nginx-local.conf"

    cat > "$LOCAL_NGINX_CONF" << NGINXCONF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen ${STATIC_PORT};
        root ${TEST_DIR};
        index dist/index.html;

        location /assets/ {
            alias ${TEST_DIR}/dist/assets/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /api/ {
            proxy_pass http://127.0.0.1:4000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            error_page 502 503 504 = @maintenance;
        }

        location / {
            proxy_pass http://127.0.0.1:4000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            error_page 502 503 504 = @maintenance;
        }

        location @maintenance {
            root ${TEST_DIR};
            rewrite ^(.*)$ /dist/index.html break;
            add_header Cache-Control "no-store";
        }

        location /health {
            access_log off;
            add_header Content-Type text/plain;
            return 200 "OK";
        }
    }
}
NGINXCONF

    # Start local Nginx with custom config
    nginx -c "$LOCAL_NGINX_CONF" -g "daemon off;" &
    STATIC_PID=$!
    success "Nginx started on port $STATIC_PORT (PID $STATIC_PID)"

elif [ "$STATIC_SERVER" = "http-server" ]; then
    # http-server with SPA support (--spa redirects 404 to index.html)
    http-server "$TEST_DIR/dist" --port "$STATIC_PORT" --spa --silent &
    STATIC_PID=$!
    success "http-server started on port $STATIC_PORT (PID $STATIC_PID)"
    warn "NOTE: http-server has no proxy or fallback — /api/ calls will fail."
    warn "This only tests that the React app loads from static files."

elif [ "$STATIC_SERVER" = "python3" ]; then
    cd "$TEST_DIR/dist"
    python3 -m http.server "$STATIC_PORT" &>/dev/null &
    STATIC_PID=$!
    cd -
    success "Python HTTP server started on port $STATIC_PORT (PID $STATIC_PID)"
    warn "NOTE: Python server has no SPA routing or proxy support."

else
    warn "Skipping static server — no server available."
fi

# ---------------------------------------------------------------------------
# Step 6: Start Node.js backend
# ---------------------------------------------------------------------------
step "Starting Node.js backend..."

if [ ! -f "Backend/.env" ]; then
    warn ".env not found in Backend/. Backend may fail to connect to MongoDB."
    warn "Create Backend/.env with your MONGO_URI and PORT=4000 before testing."
fi

cd Backend
npm install --silent

# Kill any existing backend on port 4000
if command -v lsof &>/dev/null; then
    EXISTING_PID=$(lsof -ti:4000 2>/dev/null || true)
    if [ -n "$EXISTING_PID" ]; then
        warn "Killing existing process on port 4000 (PID $EXISTING_PID)..."
        kill "$EXISTING_PID" 2>/dev/null || true
        sleep 1
    fi
fi

# Start backend in background
NODE_LOG="/tmp/abawat-backend.log"
npm start > "$NODE_LOG" 2>&1 &
BACKEND_PID=$!

cd ..

# Wait for backend to start
info "Waiting for backend to start..."
sleep 3

# Check if backend is still running
if kill -0 "$BACKEND_PID" 2>/dev/null; then
    success "Backend started (PID $BACKEND_PID)"
else
    warn "Backend may have failed to start. Check logs: cat $NODE_LOG"
fi

# ---------------------------------------------------------------------------
# Step 7: Cleanup on exit
# ---------------------------------------------------------------------------
cleanup() {
    echo ""
    info "Cleaning up..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null && info "Backend stopped."
    [ -n "$STATIC_PID" ]  && kill "$STATIC_PID"  2>/dev/null && info "Static server stopped."
    success "Cleanup complete."
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Step 8: Print testing instructions
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e "${GREEN}  LOCAL TEST ENVIRONMENT READY${NC}"
echo "============================================================"
echo ""
echo -e "  Backend running at:  ${CYAN}http://localhost:4000${NC}"
if [ -n "$STATIC_SERVER" ]; then
    echo -e "  React app at:        ${CYAN}http://localhost:${STATIC_PORT}${NC}"
else
    echo -e "  Static server:       ${YELLOW}Not available (no server installed)${NC}"
fi
echo ""
echo -e "${YELLOW}  HOW TO TEST THE NGINX FALLBACK:${NC}"
echo ""
echo "  1. Open http://localhost:${STATIC_PORT} in your browser"
echo "     → You should see the React app (proxied through to Node)"
echo ""
echo "  2. Stop the backend to simulate maintenance:"
echo "     → Open a NEW terminal and run: kill $BACKEND_PID"
echo "     → OR press Ctrl+C here and stop just the backend"
echo ""
echo "  3. Refresh http://localhost:${STATIC_PORT}"
echo "     → With Nginx: You should see the React maintenance page"
echo "     → With http-server: Page still loads (but /api/ calls fail)"
echo ""
echo "  4. Restart the backend:"
echo "     → In the new terminal: cd Backend && npm start"
echo ""
echo "  5. Wait 15 seconds (Loader.jsx poll interval)"
echo "     → The page should auto-redirect back to the original URI"
echo ""
echo "  Backend logs: tail -f $NODE_LOG"
echo ""
echo -e "${BLUE}  Press Ctrl+C to stop everything and clean up.${NC}"
echo "============================================================"
echo ""

# Keep script running until Ctrl+C
wait
