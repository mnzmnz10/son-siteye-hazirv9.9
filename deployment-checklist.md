# 🍓 Raspberry Pi Deployment Checklist - COMPLETE SETUP

## 🚀 PRE-DEPLOYMENT PREPARATION

### 1. Download Files from This Project
```bash
# Create a folder on your computer
mkdir karavan-deployment
cd karavan-deployment

# Download these files from the current project:
- raspberry-pi-setup.sh (main setup script)
- nginx.conf (nginx configuration)
- cloudflare-tunnel.yml (tunnel config)
- systemd-services.conf (service definitions)
- cloudflare-worker.js (for CloudFlare dashboard)

# Your app files:
- backend/ folder (Python FastAPI backend)
- frontend/ folder (React frontend)
```

---

## 🔧 RASPBERRY PI SETUP STEPS

### Step 1: Basic Pi Setup
```bash
# 1. Flash Raspberry Pi OS to SD card
# 2. Enable SSH in raspi-config
# 3. Connect to Pi via SSH
ssh pi@[PI_IP_ADDRESS]

# 4. Update system
sudo apt update && sudo apt upgrade -y
```

### Step 2: Run Automated Setup
```bash
# Upload and run the setup script
sudo bash raspberry-pi-setup.sh
```

### Step 3: Upload Application Files
```bash
# Using SCP from your computer:
scp -r ./backend/ pi@[PI_IP]:/home/pi/karavan-app/
scp -r ./frontend/ pi@[PI_IP]:/home/pi/karavan-app/

# Or using rsync:
rsync -avz ./backend/ pi@[PI_IP]:/home/pi/karavan-app/backend/
rsync -avz ./frontend/ pi@[PI_IP]:/home/pi/karavan-app/frontend/
```

### Step 4: Install Dependencies
```bash
# On Raspberry Pi:
cd /home/pi/karavan-app

# Backend dependencies
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend dependencies  
cd frontend
npm install
cd ..
```

### Step 5: CloudFlare Tunnel Setup
```bash
# 1. Get your tunnel credentials from CloudFlare dashboard
# 2. Copy the JSON file to Pi:
scp f36c1dc8-93cd-4739-8989-1cc52692c61f.json pi@[PI_IP]:/home/pi/.cloudflared/

# 3. Update domain in config:
sudo nano /home/pi/.cloudflared/config.yml
# Replace 'your-domain.com' with your actual domain
```

### Step 6: Start Services
```bash
# Enable and start all services
sudo systemctl enable --now karavan-backend
sudo systemctl enable --now karavan-frontend  
sudo systemctl enable --now exchange-monitor
sudo systemctl enable --now cloudflared

# Check status
sudo systemctl status karavan-backend
sudo systemctl status karavan-frontend
sudo systemctl status exchange-monitor
sudo systemctl status cloudflared
```

---

## 🌐 CLOUDFLARE CONFIGURATION

### DNS Settings
```bash
# In CloudFlare DNS:
1. Create CNAME record: corlukaravan.shop -> f36c1dc8-93cd-4739-8989-1cc52692c61f.cfargotunnel.com
2. Create CNAME record: www.corlukaravan.shop -> f36c1dc8-93cd-4739-8989-1cc52692c61f.cfargotunnel.com
3. Set Proxy to "Proxied" (orange cloud) for both records
```

### Page Rules (CRITICAL for Exchange Rates)
```bash
# Create Page Rule in CloudFlare Dashboard:
URL: corlukaravan.shop/api/exchange-rates*
Settings:
- Cache Level: Bypass
- Browser Cache TTL: Respect Existing Headers
- Edge Cache TTL: 0 seconds

# Create another Page Rule for www:
URL: www.corlukaravan.shop/api/exchange-rates*
Settings: Same as above
```

### CloudFlare Worker (OPTIONAL but RECOMMENDED)
```bash
# Deploy cloudflare-worker.js to corlukaravan.shop domain
1. Go to CloudFlare Dashboard -> Workers
2. Create new Worker
3. Paste the code from cloudflare-worker.js
4. Deploy to routes: 
   - corlukaravan.shop/api/exchange-rates*
   - www.corlukaravan.shop/api/exchange-rates*
```

---

## 🔍 TESTING & VERIFICATION

### Test Exchange Rates API
```bash
# Test from Pi locally:
curl http://localhost/api/exchange-rates | jq

# Test through CloudFlare tunnel:
curl https://your-domain.com/api/exchange-rates | jq

# Test rate updates:
curl -X POST https://your-domain.com/api/exchange-rates/update | jq
```

### Monitor Logs
```bash
# Check service logs:
sudo journalctl -u karavan-backend -f
sudo journalctl -u exchange-monitor -f
sudo journalctl -u cloudflared -f

# Check nginx logs:
sudo tail -f /var/log/nginx/karavan-access.log
sudo tail -f /var/log/nginx/karavan-error.log

# Check exchange monitor:
tail -f /home/pi/karavan-app/logs/exchange-monitor.log
```

### Verify No-Cache Headers
```bash
# Check response headers:
curl -I https://your-domain.com/api/exchange-rates

# Should see:
# Cache-Control: no-cache, no-store, must-revalidate, private
# Pragma: no-cache
# X-Timestamp: [timestamp]
# X-No-Cache: LIVE-[timestamp]
```

---

## 🚨 TROUBLESHOOTING

### Common Issues & Solutions

#### Exchange Rates Still Cached
```bash
# 1. Check nginx config:
sudo nginx -t
sudo systemctl reload nginx

# 2. Verify CloudFlare Page Rules
# 3. Check worker deployment
# 4. Force browser refresh (Ctrl+F5)
```

#### Backend Not Starting
```bash
# Check logs:
sudo journalctl -u karavan-backend -f

# Common fixes:
sudo systemctl restart karavan-backend
sudo chown -R pi:pi /home/pi/karavan-app
```

#### CloudFlare Tunnel Issues
```bash
# Check tunnel status:
sudo systemctl status cloudflared

# Re-authenticate if needed:
sudo -u pi cloudflared tunnel login
```

#### High CPU/Memory Usage
```bash
# Check resource usage:
htop

# Restart services if needed:
sudo systemctl restart karavan-backend karavan-frontend
```

---

## 🎯 FINAL VERIFICATION CHECKLIST

- [ ] Pi boots and all services start automatically
- [ ] Backend API responds at http://localhost:8001/api/
- [ ] Frontend loads at http://localhost:3000/
- [ ] Nginx serves both at http://localhost/
- [ ] CloudFlare tunnel works at https://your-domain.com/
- [ ] Exchange rates API returns fresh data (no caching)
- [ ] Exchange rate monitor logs show regular checks
- [ ] Red X buttons work in package management
- [ ] All database operations function correctly
- [ ] Auto-restart works after reboot

---

## 🔧 MAINTENANCE COMMANDS

### Regular Maintenance
```bash
# Check system health:
sudo systemctl status karavan-backend karavan-frontend exchange-monitor cloudflared

# Update exchange rates manually:
curl -X POST http://localhost/api/exchange-rates/update

# View logs:
sudo journalctl -u karavan-backend --since "1 hour ago"

# Restart all services:
sudo systemctl restart karavan-backend karavan-frontend exchange-monitor

# Check disk space:
df -h

# Check memory usage:
free -h
```

### Emergency Recovery
```bash
# If everything fails:
sudo systemctl stop karavan-backend karavan-frontend exchange-monitor
sudo systemctl start karavan-backend
sleep 30
sudo systemctl start karavan-frontend
sleep 30  
sudo systemctl start exchange-monitor

# Nuclear option - full reboot:
sudo reboot
```

---

## 📊 PERFORMANCE MONITORING

### Key Metrics to Watch
- CPU usage should stay < 80%
- Memory usage should stay < 70%
- Exchange rate API response time < 5 seconds
- No sustained error rates in logs
- Tunnel connection stable

### Alerts to Set Up
- Disk space < 20%
- Memory usage > 80%
- Exchange API failures > 3 in 10 minutes
- Backend service restarts > 2 per hour

---

🎉 **DEPLOYMENT COMPLETE!** 

Your Karavan app is now running on Raspberry Pi with:
- ✅ Nginx reverse proxy
- ✅ CloudFlare tunnel with no-cache headers
- ✅ Exchange rate monitoring and auto-recovery
- ✅ Enhanced backend with retry mechanisms
- ✅ Systemd services for auto-start
- ✅ Resource optimizations for Pi hardware

**Exchange rates will now update reliably and NOT get stuck!** 🚀