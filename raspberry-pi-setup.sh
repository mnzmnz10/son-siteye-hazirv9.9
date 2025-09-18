#!/bin/bash
# Raspberry Pi Complete Setup Script for Karavan App
# Run with: sudo bash raspberry-pi-setup.sh

set -e

echo "🚀 Starting Raspberry Pi setup for Karavan App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_status "System updated"

# Install essential packages
print_info "Installing essential packages..."
apt install -y nginx supervisor curl wget git htop nano vim build-essential
apt install -y python3 python3-pip python3-venv nodejs npm
apt install -y jq bc ufw fail2ban
print_status "Essential packages installed"

# Create app user if not exists
if ! id "pi" &>/dev/null; then
    useradd -m -s /bin/bash pi
    usermod -aG sudo pi
    print_status "User 'pi' created"
else
    print_status "User 'pi' already exists"
fi

# Create app directory
APP_DIR="/home/pi/karavan-app"
mkdir -p $APP_DIR/{backend,frontend,scripts,logs}
chown -R pi:pi $APP_DIR
print_status "App directory created: $APP_DIR"

# Setup Python virtual environment
print_info "Setting up Python virtual environment..."
sudo -u pi python3 -m venv $APP_DIR/venv
sudo -u pi $APP_DIR/venv/bin/pip install --upgrade pip
print_status "Python virtual environment created"

# Copy application files (you need to upload these separately)
print_warning "Please upload your application files to:"
print_warning "  Backend: $APP_DIR/backend/"
print_warning "  Frontend: $APP_DIR/frontend/"

# Create exchange rate monitor script
print_info "Creating exchange rate monitor script..."
cat > $APP_DIR/scripts/exchange-monitor.sh << 'EOF'
#!/bin/bash
# Exchange Rate Monitor Script for Raspberry Pi

LOG_FILE="/home/pi/karavan-app/logs/exchange-monitor.log"
API_URL="http://localhost:7000/api/exchange-rates"
UPDATE_URL="http://localhost:7000/api/exchange-rates/update"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to check API health
check_exchange_api() {
    local response=$(curl -s --connect-timeout 10 --max-time 30 "$API_URL" 2>/dev/null)
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        local usd_rate=$(echo "$response" | jq -r '.rates.USD' 2>/dev/null)
        log_message "SUCCESS: USD rate = $usd_rate"
        return 0
    else
        log_message "ERROR: Exchange API failed - Response: $response"
        return 1
    fi
}

# Function to force update rates
force_update_rates() {
    log_message "Forcing exchange rate update..."
    local response=$(curl -s -X POST --connect-timeout 30 --max-time 60 "$UPDATE_URL" 2>/dev/null)
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        log_message "SUCCESS: Exchange rates forcefully updated"
        return 0
    else
        log_message "ERROR: Failed to force update rates"
        return 1
    fi
}

# Function to restart backend if needed
restart_backend() {
    log_message "Restarting backend service..."
    systemctl restart karavan-backend
    sleep 30
    log_message "Backend restarted"
}

# Main monitoring loop
main() {
    log_message "Exchange rate monitor started"
    
    while true; do
        if ! check_exchange_api; then
            log_message "API check failed, attempting recovery..."
            
            # Try to force update first
            if force_update_rates; then
                log_message "Recovery successful via forced update"
            else
                # If update fails, restart backend
                restart_backend
                sleep 60
                
                # Check again after restart
                if check_exchange_api; then
                    log_message "Recovery successful after backend restart"
                else
                    log_message "Recovery failed, will retry in next cycle"
                fi
            fi
        fi
        
        # Check every 5 minutes
        sleep 300
    done
}

# Run main function
main
EOF

chmod +x $APP_DIR/scripts/exchange-monitor.sh
chown pi:pi $APP_DIR/scripts/exchange-monitor.sh
print_status "Exchange monitor script created"

# Create nginx configuration
print_info "Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/karavan << 'EOF'
server {
    listen 7000;
    server_name localhost corlukaravan.shop;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    client_max_body_size 50M;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate, private";
        add_header Pragma "no-cache";
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate, private";
        add_header Pragma "no-cache";
    }
    
    # CRITICAL: Exchange Rates - Special no-cache handling for corlukaravan.shop
    location /api/exchange-rates {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # FORCE NO CACHING
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate, private, max-age=0";
        add_header Pragma "no-cache";
        add_header Last-Modified $date_gmt;
        add_header ETag off;
        if_modified_since off;
        add_header X-Timestamp $msec;
        add_header X-No-Cache "CORLUKARAVAN-LIVE-$msec";
        add_header X-Domain "corlukaravan.shop";
        
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }
    
    access_log /var/log/nginx/corlukaravan-access.log;
    error_log /var/log/nginx/corlukaravan-error.log;
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/karavan /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
print_status "Nginx configured and restarted"

# Create systemd services
print_info "Creating systemd services..."

# Backend service
cat > /etc/systemd/system/karavan-backend.service << 'EOF'
[Unit]
Description=Karavan Backend API
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/karavan-app/backend
Environment=PATH=/home/pi/karavan-app/venv/bin
Environment=MONGO_URL=mongodb+srv://corlukaravan:mnzmnz10@corlukaravanteklif.gjnsd46.mongodb.net/karavan_db?retryWrites=true&w=majority
Environment=DB_NAME=karavan_db
Environment=FREECURRENCY_API_KEY=fca_live_23BGCN0W9HdvzVPE5T9cUfvWphyGDWoOTgeA5v8P
Environment=PYTHONUNBUFFERED=1
Environment=PYTHONDONTWRITEBYTECODE=1
ExecStart=/home/pi/karavan-app/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 1
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=karavan-backend
LimitNOFILE=4096
MemoryMax=512M

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/karavan-frontend.service << 'EOF'
[Unit]
Description=Karavan Frontend
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/karavan-app/frontend
Environment=PATH=/home/pi/karavan-app/frontend/node_modules/.bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=REACT_APP_BACKEND_URL=http://localhost
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=karavan-frontend
LimitNOFILE=4096
MemoryMax=256M

[Install]
WantedBy=multi-user.target
EOF

# Exchange monitor service
cat > /etc/systemd/system/exchange-monitor.service << 'EOF'
[Unit]
Description=Exchange Rate Monitor
After=karavan-backend.service nginx.service
Wants=karavan-backend.service

[Service]
Type=simple
User=pi
ExecStart=/home/pi/karavan-app/scripts/exchange-monitor.sh
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=exchange-monitor

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
print_status "Systemd services created"

# Setup firewall
print_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 7000/tcp
ufw allow 443/tcp
ufw --force enable
print_status "Firewall configured"

# Install CloudFlare tunnel
print_info "Installing CloudFlare tunnel..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -O /tmp/cloudflared.deb
dpkg -i /tmp/cloudflared.deb || apt-get install -f -y
rm -f /tmp/cloudflared.deb

# Create cloudflared directory
mkdir -p /home/pi/.cloudflared
chown pi:pi /home/pi/.cloudflared

# Create tunnel config
cat > /home/pi/.cloudflared/config.yml << 'EOF'
tunnel: f36c1dc8-93cd-4739-8989-1cc52692c61f
credentials-file: /home/pi/.cloudflared/f36c1dc8-93cd-4739-8989-1cc52692c61f.json

ingress:
  - hostname: corlukaravan.shop
    path: /api/exchange-rates*
    service: http://localhost:7000
    originRequest:
      connectTimeout: 90s
      tlsTimeout: 90s
      headers:
        Cache-Control: "no-cache, no-store, must-revalidate, private"
        Pragma: "no-cache"
        Expires: "-1"
        X-Domain: "corlukaravan.shop"
  
  - hostname: corlukaravan.shop
    path: /api/*
    service: http://localhost:7000
    originRequest:
      connectTimeout: 60s
      headers:
        Cache-Control: "no-cache, no-store, must-revalidate"
        Pragma: "no-cache"
        X-Domain: "corlukaravan.shop"
  
  - hostname: corlukaravan.shop
    service: http://localhost:7000
  
  - hostname: www.corlukaravan.shop
    service: http://localhost:7000
  
  - service: http_status:404

retries: 3
retry-interval: 5s
grace-period: 30s
loglevel: info
logfile: /var/log/cloudflared.log
EOF

chown pi:pi /home/pi/.cloudflared/config.yml
print_status "CloudFlare tunnel configured"

# Create CloudFlare tunnel service
cat > /etc/systemd/system/cloudflared.service << 'EOF'
[Unit]
Description=CloudFlare Tunnel
After=network.target nginx.service karavan-backend.service karavan-frontend.service
Wants=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/pi/.cloudflared/config.yml run f36c1dc8-93cd-4739-8989-1cc52692c61f
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cloudflared

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
print_status "CloudFlare tunnel service created"

# Setup cron jobs
print_info "Setting up cron jobs..."
(crontab -u pi -l 2>/dev/null; echo "0 4 * * * sudo systemctl restart karavan-backend karavan-frontend") | crontab -u pi -
(crontab -u pi -l 2>/dev/null; echo "0 */2 * * * curl -X POST http://localhost:7000/api/exchange-rates/update >/dev/null 2>&1") | crontab -u pi -
print_status "Cron jobs configured"

# System optimizations for Raspberry Pi
print_info "Applying Raspberry Pi optimizations..."

# Increase swap
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    print_status "Swap file created (1GB)"
fi

# GPU memory split
echo "gpu_mem=16" >> /boot/config.txt

# Network optimizations
echo "net.core.rmem_max = 134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max = 134217728" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control = bbr" >> /etc/sysctl.conf

sysctl -p
print_status "System optimizations applied"

# Final setup instructions
print_status "Setup completed! Next steps:"
echo
print_info "1. Upload your application files:"
print_info "   - Copy backend files to: $APP_DIR/backend/"
print_info "   - Copy frontend files to: $APP_DIR/frontend/"
echo
print_info "2. Install Python dependencies:"
print_info "   sudo -u pi $APP_DIR/venv/bin/pip install -r $APP_DIR/backend/requirements.txt"
echo
print_info "3. Install Node.js dependencies:"
print_info "   cd $APP_DIR/frontend && sudo -u pi npm install"
echo
print_info "4. Add your CloudFlare tunnel credentials:"
print_info "   Place the tunnel credentials JSON file at:"
print_info "   /home/pi/.cloudflared/f36c1dc8-93cd-4739-8989-1cc52692c61f.json"
echo
print_info "5. Update the domain in CloudFlare config:"
print_info "   Edit /home/pi/.cloudflared/config.yml and replace 'your-domain.com'"
echo
print_info "6. Start services:"
print_info "   sudo systemctl enable --now karavan-backend"
print_info "   sudo systemctl enable --now karavan-frontend"
print_info "   sudo systemctl enable --now exchange-monitor"
print_info "   sudo systemctl enable --now cloudflared"
echo
print_status "🎉 Raspberry Pi setup complete!"
print_warning "Don't forget to reboot after completing all steps!"

exit 0