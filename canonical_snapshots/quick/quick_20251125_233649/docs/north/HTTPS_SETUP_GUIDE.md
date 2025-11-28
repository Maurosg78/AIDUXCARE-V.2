# 🔒 **HTTPS SETUP GUIDE — MOBILE APIS REQUIREMENT**

**Date:** November 2025  
**Status:** ⚠️ **CRITICAL FOR MOBILE**  
**Purpose:** Enable HTTPS for Microphone and Clipboard APIs on mobile devices

---

## 🚨 **WHY HTTPS IS REQUIRED**

### **Mobile Browser Security Policies:**

1. **Microphone API (`getUserMedia`):**
   - Requires HTTPS (or `localhost`)
   - Blocks access on HTTP in production
   - Security requirement for privacy

2. **Clipboard API (`navigator.clipboard`):**
   - Requires HTTPS (or `localhost`)
   - Blocks access on HTTP in production
   - Security requirement for data protection

3. **Service Workers:**
   - Require HTTPS (or `localhost`)
   - Required for offline functionality

---

## 🟦 **OPTION 1: LOCAL DEVELOPMENT (localhost)**

### **For Local Testing:**

If testing on `localhost` or `127.0.0.1`, HTTPS is **NOT required**. Mobile browsers allow these APIs on localhost.

**To test on mobile device:**

1. **Find your local IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. **Start dev server with host:**
   ```bash
   npm run dev
   # Vite will show: Local: http://192.168.x.x:5174
   ```

3. **Access from mobile:**
   - Connect mobile to same WiFi network
   - Open `http://192.168.x.x:5174` on mobile browser
   - APIs should work (localhost exception)

---

## 🟦 **OPTION 2: HTTPS IN DEVELOPMENT**

### **Using Vite HTTPS:**

Vite supports HTTPS in development mode.

#### **Step 1: Generate Self-Signed Certificate**

```bash
# Create certs directory
mkdir -p certs

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

#### **Step 2: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
    host: true, // Allow external connections
    port: 5174,
  },
  // ... rest of config
});
```

#### **Step 3: Trust Certificate on Mobile**

**iOS:**
1. Open `https://YOUR_IP:5174` in Safari
2. Tap "Advanced" → "Proceed to [IP] (unsafe)"
3. Certificate will be trusted for this session

**Android:**
1. Open `https://YOUR_IP:5174` in Chrome
2. Tap "Advanced" → "Proceed to [IP] (unsafe)"
3. Certificate will be trusted for this session

---

## 🟦 **OPTION 3: PRODUCTION HTTPS (Firebase Hosting)**

### **Firebase Hosting Automatic HTTPS:**

Firebase Hosting provides **automatic HTTPS** for all deployments.

#### **Deploy to Firebase:**

```bash
# Build production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

#### **Verify HTTPS:**

1. Deployed URL will be: `https://your-project.web.app`
2. HTTPS is automatically enabled
3. All mobile APIs will work

---

## 🟦 **OPTION 4: NGINX REVERSE PROXY (Advanced)**

### **For Custom Server:**

If using custom server, configure NGINX with SSL:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## ✅ **VERIFICATION CHECKLIST**

### **After HTTPS Setup:**

- [ ] Microphone Access test passes
- [ ] Clipboard API test passes
- [ ] Service Worker registers (if used)
- [ ] No mixed content warnings
- [ ] Certificate trusted on mobile devices

### **Test Commands:**

```bash
# Check if HTTPS is working
curl -k https://localhost:5174

# Check certificate
openssl s_client -connect localhost:5174 -showcerts
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Certificate Not Trusted**

**Solution:**
- Use `localhost` or `127.0.0.1` (no HTTPS needed)
- Or use Firebase Hosting (automatic HTTPS)

### **Issue: Mixed Content Warnings**

**Solution:**
- Ensure all resources use HTTPS
- Check for hardcoded HTTP URLs

### **Issue: APIs Still Blocked**

**Solution:**
- Verify HTTPS is actually enabled (check URL bar)
- Clear browser cache
- Check browser console for errors

---

## 📋 **RECOMMENDED APPROACH**

### **For Development:**
1. Use `localhost` or local IP (no HTTPS needed)
2. Test on mobile via WiFi

### **For Production:**
1. Deploy to Firebase Hosting (automatic HTTPS)
2. All mobile APIs will work automatically

---

**Signed:** Implementation Team  
**Date:** November 2025  
**Status:** ✅ **GUIDE READY - FOLLOW STEPS ABOVE**

