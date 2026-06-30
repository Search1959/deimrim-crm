#!/bin/bash
# DEINRIM OMS — Hostinger Deployment Script
# Run this on your Hostinger server via SSH

set -e

echo "========================================"
echo "  DEINRIM OMS — Production Deploy"
echo "========================================"

# 1. Pull latest code from GitHub
echo ""
echo "▶ Pulling latest code from GitHub..."
git pull origin main

# 2. Install dependencies (only new ones)
echo ""
echo "▶ Installing / updating Node.js packages..."
npm install --production=false

# 3. Build the React frontend + bundle server
echo ""
echo "▶ Building production bundle..."
npm run build

# 4. Restart the Node.js app via PM2
echo ""
echo "▶ Restarting app with PM2..."
if pm2 list | grep -q "deimrim-crm"; then
  pm2 restart deimrim-crm
else
  pm2 start server.js --name deimrim-crm
fi
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "   Live at: https://deinrim360.in"
echo ""
pm2 status deimrim-crm
