# 🚀 SSL Tunnel Implementation Plan - EXECUTE NOW

**Status:** ✅ **CTO APPROVED**  
**Priority:** **HIGH**  
**Timeline:** Complete this week (before Sprint 2)  
**Estimated Time:** 30 minutes setup + 15 minutes testing

---

## 📋 Pre-Implementation Checklist

### Prerequisites:

- [ ] Domain `aiduxcare.com` accessible in Porkbun account
- [ ] Cloudflare account (free) - create at https://dash.cloudflare.com/sign-up
- [ ] Mac terminal access
- [ ] 30 minutes allocated

---

## 🎯 Step-by-Step Implementation

### **Step 1: Install Cloudflare Tunnel (5 minutes)**

```bash
# Install cloudflared via Homebrew
brew install cloudflared

# Verify installation
cloudflared --version
```

**Expected Output:**
```
cloudflared version X.X.X
```

---

### **Step 2: Login to Cloudflare (2 minutes)**

```bash
# This will open browser for authentication
cloudflared tunnel login
```

**Actions:**
1. Browser opens automatically
2. Select domain `aiduxcare.com` (or create account if needed)
3. Authorize tunnel access
4. Return to terminal

**Expected Output:**
```
Successfully logged in.
```

---

### **Step 3: Create Tunnel (3 minutes)**

```bash
# Create tunnel named 'aiduxcare-dev'
cloudflared tunnel create aiduxcare-dev
```

**Expected Output:**
```
Created tunnel aiduxcare-dev with id [TUNNEL-ID]
```

**⚠️ IMPORTANT:** Save the `[TUNNEL-ID]` - you'll need it for configuration.

---

### **Step 4: Configure DNS in Porkbun (5 minutes)**

1. **Login to Porkbun:** https://porkbun.com/account/login
2. **Select Domain:** `aiduxcare.com`
3. **Add DNS Record:**
   - **Type:** CNAME
   - **Name:** `dev`
   - **Content:** `[TUNNEL-ID].cfargotunnel.com`
   - **TTL:** Auto (or 300)
4. **Save**

**Alternative: Use Cloudflare DNS (if domain is transferred):**

```bash
# Configure DNS automatically via Cloudflare
cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com
```

**Expected Output:**
```
Route added: dev.aiduxcare.com → aiduxcare-dev
```

---

### **Step 5: Configure Tunnel (10 minutes)**

Create tunnel configuration file:

```bash
# Create config directory
mkdir -p ~/.cloudflared

# Get tunnel ID (from Step 3)
TUNNEL_ID=$(cloudflared tunnel list | grep aiduxcare-dev | awk '{print $1}')

# Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: dev.aiduxcare.com
    service: https://localhost:5174
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF
```

**Verify configuration:**

```bash
# Test configuration
cloudflared tunnel ingress validate
```

**Expected Output:**
```
Configuration is valid.
```

---

### **Step 6: Test Tunnel (5 minutes)**

```bash
# Start tunnel (in separate terminal or background)
cloudflared tunnel run aiduxcare-dev
```

**Expected Output:**
```
2025-11-20T... INF Starting metrics server
2025-11-20T... INF +--------------------------------------------------------------------------------------------+
2025-11-20T... INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2025-11-20T... INF |  https://dev.aiduxcare.com                                                                    |
2025-11-20T... INF +--------------------------------------------------------------------------------------------+
```

**Test Access:**
1. Start dev server: `npm run dev:https` (in another terminal)
2. Wait 30 seconds for tunnel to connect
3. Open browser: `https://dev.aiduxcare.com`
4. Should see AiduxCare app

---

### **Step 7: Update Project Configuration (5 minutes)**

Update `.env.local`:

```bash
# Update VITE_DEV_PUBLIC_URL
sed -i '' "s|^VITE_DEV_PUBLIC_URL=.*|VITE_DEV_PUBLIC_URL=https://dev.aiduxcare.com|" .env.local

# Verify
grep VITE_DEV_PUBLIC_URL .env.local
```

**Expected Output:**
```
VITE_DEV_PUBLIC_URL=https://dev.aiduxcare.com
```

---

### **Step 8: Create Startup Script (5 minutes)**

The project already includes `scripts/start-dev-with-tunnel.sh`, but verify it works:

```bash
# Test the script
npm run dev:tunnel
```

This should:
1. Start Vite dev server
2. Start Cloudflare tunnel
3. Show both URLs (local + public)

---

## ✅ Post-Implementation Validation

### **Success Criteria:**

- [ ] `https://dev.aiduxcare.com` loads in browser
- [ ] SSL certificate is valid (no warnings)
- [ ] App functions correctly via tunnel
- [ ] Can access from iPhone (different network)
- [ ] Multiple devices can access simultaneously

### **Testing Checklist:**

1. **Local Browser Test:**
   ```bash
   # Start tunnel + server
   npm run dev:tunnel
   
   # Open: https://dev.aiduxcare.com
   # Should load without SSL warnings
   ```

2. **iPhone Test (Different Network):**
   - Connect iPhone to mobile data (not WiFi)
   - Open Safari
   - Navigate to: `https://dev.aiduxcare.com`
   - Should load without certificate installation

3. **Multi-Device Test:**
   - Access from iPhone
   - Access from iPad (if available)
   - Access from laptop
   - All should work simultaneously

---

## 🔧 Troubleshooting

### **Issue: "Tunnel not found"**

```bash
# List all tunnels
cloudflared tunnel list

# If missing, recreate:
cloudflared tunnel create aiduxcare-dev
```

### **Issue: "DNS not resolving"**

```bash
# Check DNS propagation
dig dev.aiduxcare.com

# Or use Cloudflare DNS directly:
cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com
```

### **Issue: "Connection refused"**

```bash
# Verify dev server is running
lsof -i :5174

# Start dev server first:
npm run dev:https
```

### **Issue: "SSL certificate error"**

- Cloudflare Tunnel provides SSL automatically
- If error persists, check tunnel is running:
  ```bash
  cloudflared tunnel run aiduxcare-dev
  ```

---

## 📊 Implementation Status

### **Phase 1: Setup** (30 minutes)
- [ ] Install cloudflared
- [ ] Login to Cloudflare
- [ ] Create tunnel
- [ ] Configure DNS
- [ ] Configure tunnel
- [ ] Test tunnel

### **Phase 2: Integration** (15 minutes)
- [ ] Update .env.local
- [ ] Test startup script
- [ ] Verify multi-device access

### **Phase 3: Validation** (15 minutes)
- [ ] Local browser test
- [ ] iPhone test (different network)
- [ ] Multi-device test
- [ ] Document any issues

**Total Time:** ~60 minutes (including testing)

---

## 🎯 Next Steps After Implementation

1. **Share URL with testers:** `https://dev.aiduxcare.com`
2. **Update Sprint 2 testing plan** to use new URL
3. **Monitor tunnel stability** during Sprint 2
4. **Collect tester feedback** on domain experience

---

## 📞 Support

**Documentation:**
- `docs/north/DOMAIN_SETUP_FOR_TESTING.md`
- `docs/north/TESTING_SETUP_FOR_PHYSIOTHERAPISTS.md`

**Scripts:**
- `scripts/setup-cloudflare-tunnel.sh` - Setup guide
- `scripts/start-dev-with-tunnel.sh` - Startup script

**Commands:**
- `npm run setup:tunnel` - Interactive setup
- `npm run dev:tunnel` - Start everything

---

**Status:** ✅ **READY TO EXECUTE**  
**CTO Authorization:** ✅ **GRANTED**  
**Implementation Window:** **This week**

