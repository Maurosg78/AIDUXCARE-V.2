# 🔧 Troubleshooting: DNS Cache Issue

**Date:** November 21, 2025  
**Issue:** DNS_PROBE_FINISHED_NXDOMAIN in browser despite DNS resolving correctly

---

## 📊 Problem Summary

**Symptoms:**
- ✅ `dig` resolves `dev.aiduxcare.com` correctly
- ✅ Public DNS servers resolve correctly
- ✅ Tunnel is running and connected
- ✅ Hostname registered in Cloudflare
- ❌ Browser shows `DNS_PROBE_FINISHED_NXDOMAIN`
- ❌ `curl` cannot resolve hostname

**Root Cause:** macOS DNS resolver cache is stale

---

## 🔍 Verification

### **What Works:**
```bash
$ dig @8.8.8.8 dev.aiduxcare.com +short
9593fedf-d3de-4df8-8a7f-9c959af75b68.cfargotunnel.com.

$ dig @1.1.1.1 dev.aiduxcare.com +short
9593fedf-d3de-4df8-8a7f-9c959af75b68.cfargotunnel.com.

$ dig dev.aiduxcare.com +short
9593fedf-d3de-4df8-8a7f-9c959af75b68.cfargotunnel.com.
```

### **What Doesn't Work:**
```bash
$ curl https://dev.aiduxcare.com
curl: (6) Could not resolve host: dev.aiduxcare.com
```

**Browser:** `DNS_PROBE_FINISHED_NXDOMAIN`

---

## 🔧 Solutions

### **Solution 1: Clear DNS Cache (Requires Password)**

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Then:**
1. Close Chrome completely (`Cmd+Q`)
2. Wait 5 seconds
3. Reopen Chrome
4. Try `https://dev.aiduxcare.com`

**Expected:** Should work immediately after cache flush

---

### **Solution 2: Test from iPhone (RECOMMENDED)**

**Why:** Bypasses local DNS cache entirely

**Steps:**
1. Disconnect iPhone from WiFi
2. Use mobile data (4G/5G)
3. Open Safari
4. Navigate to: `https://dev.aiduxcare.com`

**Expected:** Should work immediately (uses carrier DNS, which is public)

**If this works:** Tunnel is functional, only local cache issue

---

### **Solution 3: Wait for Natural Cache Expiration**

**Timeline:** 15-30 minutes

**Why:** DNS cache TTL is 600 seconds (10 minutes), but macOS may cache longer

**Action:** Continue development work, test every 5 minutes

---

### **Solution 4: Use Different Browser**

**Try:**
- Firefox (uses different DNS cache)
- Safari (may have different cache behavior)
- Edge (if installed)

**Expected:** May work if browser uses different DNS resolver

---

## 📊 Technical Explanation

### **Why This Happens:**

1. **DNS Resolution Layers:**
   - `dig` → Uses system resolver directly
   - `curl` → Uses system resolver with additional caching
   - Browser → Uses system resolver + browser DNS cache

2. **macOS DNS Cache:**
   - `dscacheutil` maintains DNS cache
   - May cache negative responses (NXDOMAIN)
   - Cache may persist longer than TTL

3. **Browser DNS Cache:**
   - Chrome has its own DNS cache
   - May cache negative responses
   - Requires browser restart to clear

### **Why Public DNS Works:**

- Public DNS servers (8.8.8.8, 1.1.1.1) don't have cached negative responses
- They query authoritative DNS directly
- They see the correct CNAME record immediately

---

## ✅ Success Criteria

**Tunnel is working correctly when:**
- ✅ iPhone mobile data test works
- ✅ External network test works
- ✅ Public DNS resolves correctly
- ✅ Tunnel is connected

**Local access will work when:**
- ✅ DNS cache expires or is cleared
- ✅ Browser cache is cleared
- ✅ System resolver updates

---

## 🎯 Recommended Action Plan

### **Immediate (2 minutes):**
1. Test from iPhone with mobile data
2. If works → Tunnel is functional ✅

### **Short-term (5 minutes):**
1. Clear DNS cache (`sudo dscacheutil -flushcache`)
2. Close and reopen browser
3. Test again

### **Long-term (15-30 minutes):**
1. Wait for natural cache expiration
2. Test periodically

---

## 📝 Notes

- This is **normal DNS behavior**, not a configuration error
- Tunnel is configured correctly
- DNS records are correct
- Only local cache needs to update

**Confidence:** **HIGH** - Standard DNS cache issue, will resolve automatically

---

**Last Updated:** November 21, 2025  
**Status:** Waiting for DNS cache update

