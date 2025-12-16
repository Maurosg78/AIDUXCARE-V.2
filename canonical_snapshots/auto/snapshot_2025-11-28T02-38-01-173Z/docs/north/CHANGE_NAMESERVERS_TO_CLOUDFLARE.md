# 🔧 Change Nameservers to Cloudflare - Step by Step

**Date:** November 21, 2025  
**Purpose:** Complete Cloudflare Tunnel setup by changing nameservers

---

## 📋 Current Status

**Domain:** `aiduxcare.com`  
**Status:** Pending (nameservers still in Porkbun)  
**CNAME:** Configured correctly with Proxy enabled ✅  
**Issue:** Domain pending until nameservers changed

---

## 🎯 Why Change Nameservers?

**Current Problem:**
- Domain shows "pending" in Cloudflare
- Tunnel may not work fully until nameservers are changed
- Cloudflare needs to verify domain ownership

**Benefits:**
- ✅ Domain becomes "Active" in Cloudflare
- ✅ Better Tunnel integration
- ✅ Automatic SSL/TLS
- ✅ Better performance
- ✅ All DNS managed in one place

---

## 📋 Step-by-Step Instructions

### **Step 1: Get Cloudflare Nameservers**

**In Cloudflare Dashboard:**
1. Go to domain `aiduxcare.com`
2. Scroll to "Cloudflare Nameservers" section
3. Copy these 2 nameservers:
   - `aida.ns.cloudflare.com`
   - `phil.ns.cloudflare.com`

**You should see:**
```
Type    Value
NS      aida.ns.cloudflare.com
NS      phil.ns.cloudflare.com
```

---

### **Step 2: Update Nameservers in Porkbun**

**In Porkbun:**

1. **Login:** https://porkbun.com/account/login

2. **Select Domain:** Click on `aiduxcare.com`

3. **Go to Nameservers:** Find "Nameservers" section

4. **Current Nameservers (DELETE these):**
   - `curitiba.ns.porkbun.com`
   - `fortaleza.ns.porkbun.com`
   - `maceio.ns.porkbun.com`
   - `salvador.ns.porkbun.com`

5. **Add Cloudflare Nameservers:**
   - Click "Edit" or "Change"
   - Delete all 4 Porkbun nameservers
   - Add: `aida.ns.cloudflare.com`
   - Add: `phil.ns.cloudflare.com`
   - **Only 2 nameservers needed** (Cloudflare uses 2, Porkbun uses 4)

6. **Save Changes**

---

### **Step 3: Wait for Propagation**

**Timeline:** 5-15 minutes

**What Happens:**
- DNS changes propagate globally
- Cloudflare detects nameserver change
- Domain status changes from "pending" to "Active"

**You Can:**
- Continue working
- Check Cloudflare dashboard every 5 minutes
- Status will update automatically

---

### **Step 4: Verify in Cloudflare**

**Check Status:**
1. Go to Cloudflare Dashboard
2. Domain should show "Active" instead of "pending"
3. "Invalid nameservers" warning should disappear

**Expected Timeline:**
- **5 minutes:** Nameservers start propagating
- **10 minutes:** Cloudflare detects change
- **15 minutes:** Domain becomes "Active"

---

### **Step 5: Test Tunnel Access**

**After Domain is Active:**

1. **Wait 2-3 minutes** after status changes to "Active"

2. **Test from iPhone:**
   - Mobile data (not WiFi)
   - Safari → `https://dev.aiduxcare.com`
   - Should work now ✅

3. **Test from Browser:**
   - `https://dev.aiduxcare.com`
   - Should work ✅

---

## ⚠️ Important Notes

### **DNS Records:**

**Before Changing Nameservers:**
- DNS records are in Porkbun
- CNAME for `dev` is in Cloudflare (imported)

**After Changing Nameservers:**
- All DNS queries go to Cloudflare
- Cloudflare serves DNS records
- Existing records in Cloudflare will be used
- Records in Porkbun become inactive

**Action Required:**
- ✅ Verify all DNS records are in Cloudflare
- ✅ They should already be there (imported during setup)
- ✅ If missing, add them in Cloudflare DNS

---

### **Email (MX Records):**

**Current MX Record:**
- `smtp.google.com` (for Gmail/Google Workspace)

**After Nameserver Change:**
- MX record in Cloudflare will be used
- Verify it's correct: `smtp.google.com` priority 1
- Email should continue working

---

### **Website (A Records):**

**Current A Records:**
- `aiduxcare.com` → `52.33.207.7` (Proxied)
- `aiduxcare.com` → `44.230.85.241` (Proxied)
- `app.aiduxcare.com` → `199.36.158.100` (Proxied)

**After Nameserver Change:**
- These will be served by Cloudflare
- Should continue working
- May see improved performance

---

## 🔍 Verification Checklist

**Before Changing:**
- [ ] Cloudflare nameservers copied
- [ ] All important DNS records verified in Cloudflare
- [ ] Backup of current Porkbun DNS records (optional)

**After Changing:**
- [ ] Nameservers updated in Porkbun
- [ ] Wait 5-15 minutes
- [ ] Domain status changes to "Active" in Cloudflare
- [ ] Test `https://dev.aiduxcare.com` from iPhone
- [ ] Test main website still works
- [ ] Test email still works

---

## 🚨 Troubleshooting

### **Issue: Domain Still "Pending" After 30 Minutes**

**Possible Causes:**
- Nameservers not changed correctly
- Propagation delay (rare, but can take up to 24 hours)

**Solution:**
1. Verify nameservers in Porkbun are correct
2. Check DNS propagation: `dig NS aiduxcare.com`
3. Wait longer (up to 1 hour)

---

### **Issue: Website Not Working After Change**

**Possible Causes:**
- DNS records not imported correctly
- Missing A records

**Solution:**
1. Check DNS records in Cloudflare
2. Verify A records exist
3. Add missing records if needed

---

### **Issue: Email Not Working**

**Possible Causes:**
- MX record missing or incorrect

**Solution:**
1. Check MX record in Cloudflare DNS
2. Should be: `smtp.google.com` priority 1
3. Add if missing

---

## ✅ Success Criteria

**Domain Setup Complete When:**
- ✅ Nameservers changed to Cloudflare
- ✅ Domain status: "Active" in Cloudflare
- ✅ `https://dev.aiduxcare.com` accessible from iPhone
- ✅ Main website still works
- ✅ Email still works

---

## 📊 Expected Timeline

**Total Time:** 15-30 minutes

**Breakdown:**
- Nameserver change: 2 minutes
- DNS propagation: 5-15 minutes
- Cloudflare verification: 2-5 minutes
- Testing: 5 minutes

---

**Last Updated:** November 21, 2025  
**Status:** Ready to change nameservers

