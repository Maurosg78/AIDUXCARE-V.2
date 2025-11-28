# 📱 **IPHONE HTTPS SETUP — QUICK GUIDE**

**Date:** November 2025  
**Status:** ⚠️ **CRITICAL - REQUIRED FOR MICROPHONE API**  
**Issue:** iPhone accessing via HTTP, APIs blocked

---

## 🚨 **CURRENT STATUS**

### **iPhone Test Results (HTTP):**
- ❌ **Microphone Access:** FAIL - "getUserMedia not available. Ensure HTTPS or localhost."
- ❌ **Clipboard API:** FAIL - "Clipboard API not available"
- ⚠️ **FPS:** 30 (may be low power mode)
- ✅ **Touch Latency:** 0.00ms
- ✅ **Other APIs:** MediaRecorder, Touch, Viewport, Audio Context, Performance API - All PASS

### **Root Cause:**
Accessing via **HTTP** (`http://172.20.10.11:5174`) instead of **HTTPS**. Mobile browsers block Microphone and Clipboard APIs on HTTP (except localhost).

---

## ✅ **SOLUTION: ENABLE HTTPS**

### **Step 1: Generate Certificates (One-time setup)**

```bash
# Run the setup script
bash scripts/setup-https-dev.sh
```

This will create:
- `certs/key.pem` (private key)
- `certs/cert.pem` (certificate)

### **Step 2: Start HTTPS Dev Server**

```bash
# Start server with HTTPS
npm run dev:https
```

The server will start on `https://localhost:5174` and will be accessible from your network.

### **Step 3: Find Your Local IP**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or check the Vite output - it shows the network URL
# Example: Network: https://192.168.1.100:5174
```

### **Step 4: Access from iPhone**

1. **Open Safari on iPhone**
2. **Navigate to:** `https://YOUR_IP:5174`
   - Example: `https://172.20.10.11:5174`
3. **Trust Certificate:**
   - Safari will show "This connection is not private"
   - Tap **"Advanced"**
   - Tap **"Proceed to [IP] (unsafe)"**
   - Certificate will be trusted for this session

### **Step 5: Verify APIs Work**

1. **Open Mobile Test Harness** (purple button, bottom right)
2. **Click "Run Tests"**
3. **Verify:**
   - ✅ Microphone Access: Should now PASS
   - ✅ Clipboard API: Should now PASS (or show execCommand fallback)
   - ✅ FPS: Should be 60 (if device not in low power mode)

---

## 🐛 **TROUBLESHOOTING**

### **Issue: "This site can't be reached"**

**Solution:**
- Ensure iPhone and computer are on **same WiFi network**
- Check firewall isn't blocking port 5174
- Verify IP address is correct

### **Issue: Certificate not trusted**

**Solution:**
- Tap "Advanced" → "Proceed to [IP] (unsafe)"
- Or use `localhost` if testing on same device (requires USB debugging)

### **Issue: FPS still low (30)**

**Possible Causes:**
- Device in **Low Power Mode** (Settings → Battery → Low Power Mode)
- Device screen locked or inactive
- Background apps consuming resources

**Solution:**
- Disable Low Power Mode
- Keep device active during test
- Close other apps

### **Issue: Microphone still not working**

**Check:**
1. HTTPS is actually enabled (check URL bar shows 🔒)
2. Certificate is trusted
3. Microphone permissions granted in Safari Settings
4. Try accessing via `localhost` if on same device

---

## 📋 **QUICK CHECKLIST**

- [ ] Certificates generated (`certs/` directory exists)
- [ ] HTTPS server started (`npm run dev:https`)
- [ ] IP address noted
- [ ] iPhone on same WiFi network
- [ ] Accessed via `https://IP:5174` (not `http://`)
- [ ] Certificate trusted in Safari
- [ ] Mobile Test Harness opened
- [ ] Tests run - Microphone PASS
- [ ] Tests run - Clipboard PASS
- [ ] FPS > 55 (if device active)

---

## 🎯 **EXPECTED RESULTS AFTER HTTPS**

### **Before (HTTP):**
- ❌ Microphone Access: FAIL
- ❌ Clipboard API: FAIL
- ⚠️ FPS: 30

### **After (HTTPS):**
- ✅ Microphone Access: PASS
- ✅ Clipboard API: PASS (or execCommand fallback)
- ✅ FPS: 60 (if device active, not in low power mode)

---

## 📝 **NOTES**

- **Self-signed certificates** are fine for development
- **Production** will use Firebase Hosting (automatic HTTPS)
- **Low Power Mode** can reduce FPS to 30 (expected behavior)
- **Touch latency** is already excellent (0.00ms)

---

**Signed:** Implementation Team  
**Date:** November 2025  
**Status:** ⚠️ **REQUIRES HTTPS SETUP - FOLLOW STEPS ABOVE**

