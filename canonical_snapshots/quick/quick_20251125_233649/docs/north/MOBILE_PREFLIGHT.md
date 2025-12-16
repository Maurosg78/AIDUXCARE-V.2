# 📱 **MOBILE PRE-FLIGHT CHECK — DOCUMENTATION**

**Date:** November 2025  
**Status:** ✅ **READY FOR USE**  
**Purpose:** Validate environment before real device testing

---

## 🎯 **WHAT IS PRE-FLIGHT CHECK?**

The Mobile Pre-Flight Check is an automated script that validates your development environment before testing on real mobile devices. It ensures:

- ✅ Ports are available
- ✅ IPv4 is accessible
- ✅ Certificates are valid
- ✅ HTTPS configuration is correct
- ✅ Required endpoints exist
- ✅ System performance is acceptable

---

## 🚀 **USAGE**

### **Run Pre-Flight Check:**

```bash
npm run mobile:preflight
```

### **Expected Output:**

```
╔══════════════════════════════════════════════════════════════╗
║  📱 MOBILE PRE-FLIGHT CHECK                                 ║
╚══════════════════════════════════════════════════════════════╝

✅ Port Availability: Port 5174 is available
✅ IPv4 Accessible: Local IP: 172.20.10.11 (1 interface found)
✅ Certificates: Certificates found and valid format
✅ HTTPS Config: HTTPS configuration found
✅ Endpoint: Mobile Test Harness: Available
✅ Endpoint: Mobile Instrumentation: Available
✅ Endpoint: Performance Utilities: Available
✅ Performance Base: System responsive (12ms)

────────────────────────────────────────────────────────────
📊 SUMMARY:

✅ Passed:  8
❌ Failed:  0
⚠️  Warnings: 0

✅ PRE-FLIGHT CHECK: PASS
   Ready for real device testing

📋 NEXT STEPS:
   1. Start server: npm run dev:https
   2. Access from mobile: https://172.20.10.11:5174
   3. Trust certificate on mobile device
   4. Run Mobile Test Harness
```

---

## ✅ **CHECKS PERFORMED**

### **1. Port Availability**

**Check:** Verifies port 5174 is available  
**Status:** PASS / WARN / FAIL  
**Action if FAIL:** Kill processes using port or use different port

---

### **2. IPv4 Accessible**

**Check:** Finds local IPv4 address  
**Status:** PASS / FAIL  
**Action if FAIL:** Ensure WiFi/Ethernet is connected

---

### **3. Certificates**

**Check:** Verifies certificates exist and are valid  
**Status:** PASS / FAIL  
**Action if FAIL:** Run `bash scripts/setup-https-dev.sh`

---

### **4. HTTPS Config**

**Check:** Verifies `vite.config.https.ts` exists and is configured  
**Status:** PASS / FAIL  
**Action if FAIL:** Ensure `vite.config.https.ts` exists

---

### **5. Endpoints**

**Check:** Verifies required files exist:
- Mobile Test Harness
- Mobile Instrumentation
- Performance Utilities

**Status:** PASS / FAIL  
**Action if FAIL:** Ensure all files are present

---

### **6. Performance Base**

**Check:** Basic system responsiveness test  
**Status:** PASS / WARN / FAIL  
**Action if WARN/FAIL:** System may be slow, consider restarting

---

## 📋 **INTERPRETING RESULTS**

### **✅ PASS:**

All checks passed. Ready for real device testing.

**Next Steps:**
1. Start HTTPS server: `npm run dev:https`
2. Access from mobile device
3. Trust certificate
4. Run Mobile Test Harness

---

### **⚠️ WARNINGS:**

Some checks have warnings but are not blocking.

**Common Warnings:**
- Port in use (Vite will use another port)
- System performance may be slow

**Action:** Review warnings, proceed if acceptable.

---

### **❌ FAIL:**

One or more critical checks failed.

**Action:** Fix issues before proceeding:
1. Review failed checks
2. Follow action items above
3. Re-run pre-flight check
4. Proceed only when all checks pass

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Port Not Available**

**Solution:**
```bash
# Kill process on port 5174
lsof -ti:5174 | xargs kill -9

# Or use different port
npm run dev:https -- --port 5175
```

### **Issue: No IPv4 Found**

**Solution:**
- Ensure WiFi/Ethernet is connected
- Check network settings
- Restart network interface

### **Issue: Certificates Not Found**

**Solution:**
```bash
bash scripts/setup-https-dev.sh
```

### **Issue: HTTPS Config Missing**

**Solution:**
- Ensure `vite.config.https.ts` exists
- Verify configuration is correct

---

## 📝 **INTEGRATION WITH TESTING WORKFLOW**

### **Before Real Device Testing:**

1. **Run Pre-Flight Check:**
   ```bash
   npm run mobile:preflight
   ```

2. **Verify All Checks Pass:**
   - If FAIL: Fix issues
   - If PASS: Proceed

3. **Start HTTPS Server:**
   ```bash
   npm run dev:https
   ```

4. **Access from Mobile:**
   - Use IP shown in pre-flight check
   - Trust certificate
   - Run Mobile Test Harness

---

## ✅ **SUCCESS CRITERIA**

Pre-Flight Check is successful when:

- ✅ All checks return PASS
- ✅ No critical failures
- ✅ Warnings are acceptable
- ✅ Ready for real device testing

---

**Signed:** Implementation Team  
**Date:** November 2025  
**Status:** ✅ **DOCUMENTATION COMPLETE**

