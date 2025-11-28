# ✅ Cloudflare DNS Configuration Checklist

**Date:** November 21, 2025  
**Purpose:** Verify all Cloudflare DNS settings for Tunnel functionality

---

## 📋 Checklist

### **1. Domain Added to Cloudflare** ✅

- [x] Domain `aiduxcare.com` added to Cloudflare
- [x] Plan: Free
- [ ] Status: "Invalid nameservers" (normal if nameservers not changed)

---

### **2. DNS Records Configuration**

**Location:** Cloudflare Dashboard → `aiduxcare.com` → DNS

**Required Record:**
- [ ] **CNAME Record exists:**
  - **Name:** `dev`
  - **Target:** `9593fedf-d3de-4df8-8a7f-9c959af75b68.cfargotunnel.com`
  - **Proxy status:** **Proxied** (orange cloud icon) ⚠️ IMPORTANT
  - **TTL:** Auto

**How to Check:**
1. Click on `aiduxcare.com` in Cloudflare dashboard
2. Go to "DNS" section (left sidebar)
3. Look for CNAME record with name "dev"
4. Verify proxy status is "Proxied" (orange cloud)

**If Missing:**
1. Click "Add record"
2. Select "CNAME"
3. Name: `dev`
4. Target: `9593fedf-d3de-4df8-8a7f-9c959af75b68.cfargotunnel.com`
5. **Enable proxy** (orange cloud icon)
6. Save

---

### **3. SSL/TLS Settings**

**Location:** Cloudflare Dashboard → `aiduxcare.com` → SSL/TLS

**Required Setting:**
- [ ] **SSL/TLS encryption mode:** `Full` or `Full (strict)`

**Why:** Allows Cloudflare to connect to your local HTTPS server

**How to Check:**
1. Go to SSL/TLS section
2. Find "Overview" tab
3. Check "Encryption mode"
4. Should be "Full" or "Full (strict)"

**If Wrong:**
1. Change to "Full" (allows self-signed certificates)
2. Or "Full (strict)" (requires valid certificate)

---

### **4. Nameservers (Optional but Recommended)**

**Current Status:** "Invalid nameservers" shown in dashboard

**Option A: Change to Cloudflare Nameservers (RECOMMENDED)**

**Steps:**
1. In Cloudflare dashboard, go to domain overview
2. Find "Nameservers" section
3. Copy the 2 nameservers shown (e.g., `aida.ns.cloudflare.com`, `phil.ns.cloudflare.com`)
4. Go to Porkbun → `aiduxcare.com` → Nameservers
5. Replace existing nameservers with Cloudflare ones
6. Save
7. Wait 5-15 minutes for propagation

**Benefits:**
- Better Tunnel integration
- Automatic SSL/TLS
- Better performance
- All DNS in one place

**Option B: Keep Porkbun Nameservers**

**Steps:**
1. Keep nameservers in Porkbun as they are
2. Ensure CNAME record exists in Cloudflare DNS
3. Tunnel should still work

**Limitations:**
- "Invalid nameservers" warning will persist
- May have some limitations
- Less optimal integration

---

### **5. Tunnel Status**

**Verify:**
- [ ] Tunnel is running: `cloudflared tunnel run aiduxcare-dev`
- [ ] Tunnel connected (check logs for "Registered tunnel connection")
- [ ] Hostname registered: `cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com`

**Check Command:**
```bash
ps aux | grep "cloudflared tunnel run" | grep -v grep
```

**Expected:** Process running

---

### **6. Local Server Status**

**Verify:**
- [ ] Vite server running on port 5174
- [ ] HTTPS enabled
- [ ] Accessible locally: `https://localhost:5174`

**Check Command:**
```bash
lsof -i :5174 | grep LISTEN
```

**Expected:** Process listening on port 5174

---

## 🎯 Critical Settings Summary

### **Must Have:**
1. ✅ Domain in Cloudflare
2. ⚠️ **CNAME record for `dev` with Proxy enabled** (CRITICAL)
3. ⚠️ **SSL/TLS mode set to "Full"** (CRITICAL)
4. ✅ Tunnel running
5. ✅ Local server running

### **Nice to Have:**
- Cloudflare nameservers (better integration)
- All DNS records in Cloudflare

---

## 🔧 Quick Fix Commands

### **Verify Tunnel:**
```bash
cloudflared tunnel info aiduxcare-dev
```

### **Re-register Hostname:**
```bash
cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com
```

### **Check DNS Resolution:**
```bash
dig dev.aiduxcare.com @1.1.1.1 +short
```

### **Test Local Server:**
```bash
curl -k https://localhost:5174
```

---

## ⚠️ Common Issues

### **Issue 1: "Invalid nameservers"**
**Solution:** Either change nameservers to Cloudflare OR ignore (Tunnel can work without)

### **Issue 2: CNAME not proxied**
**Solution:** Enable proxy (orange cloud) in DNS record settings

### **Issue 3: SSL/TLS mode wrong**
**Solution:** Change to "Full" in SSL/TLS settings

### **Issue 4: Tunnel not connecting**
**Solution:** Restart tunnel, check credentials file exists

---

## ✅ Success Criteria

**Tunnel works when:**
- ✅ CNAME record exists and is proxied
- ✅ SSL/TLS mode is "Full"
- ✅ Tunnel is running
- ✅ Local server is running
- ✅ DNS resolves correctly

**Test:** `https://dev.aiduxcare.com` accessible from iPhone with mobile data

---

**Last Updated:** November 21, 2025  
**Status:** Configuration checklist

