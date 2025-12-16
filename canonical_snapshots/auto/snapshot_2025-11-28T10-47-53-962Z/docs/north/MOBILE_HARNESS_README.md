# 📱 **MOBILE TEST HARNESS — USER GUIDE**

**Purpose:** Guide for using the Mobile Test Harness on real devices

---

## 🎯 **WHAT IS THE MOBILE TEST HARNESS?**

The Mobile Test Harness is a diagnostic tool that helps you test mobile-specific functionality on real devices. It provides:

- Device information detection
- Performance metrics tracking
- Automated capability tests
- Real-time monitoring

---

## 🚀 **HOW TO USE**

### **1. Access the Harness**

The Mobile Test Harness is available as a floating button in the bottom-right corner of the application (next to the Feedback Widget).

**On Desktop:**
- Look for the purple button with a checkmark icon
- Click to open the harness

**On Mobile:**
- The button is always visible
- Tap to open the harness

---

### **2. Device Information**

The harness automatically detects and displays:

- **Device Type:** mobile / tablet / desktop
- **Platform:** iOS / Android / Other
- **Browser:** Safari / Chrome / Other
- **Screen Size:** Width x Height
- **Capabilities:** Touch support, Microphone, MediaRecorder

**Use this to verify:**
- Correct device detection
- Browser identification
- Screen dimensions

---

### **3. Performance Metrics**

The harness tracks real-time performance metrics:

- **FPS:** Frames per second (target: 60)
- **Frame Drops:** Number of frames dropped (target: 0)
- **Scroll Jank:** Number of scroll jank events (target: 0)
- **Touch Latency:** Average touch event latency (target: < 50ms)
- **Initial Render Time:** Time to first render (target: < 1000ms)
- **DOM Performance:** Layout, Paint, Composite times

**Use this to:**
- Identify performance issues
- Compare metrics across devices
- Track performance regressions

---

### **4. Running Tests**

Click the **"Run Tests"** button to execute automated tests:

#### **Test 1: Microphone Access**
- Tests if microphone permission can be requested
- **Expected:** Permission prompt appears
- **If Fails:** Check browser settings, ensure HTTPS

#### **Test 2: MediaRecorder Support**
- Tests which audio MIME types are supported
- **Expected:** At least one MIME type supported
- **If Fails:** Browser may not support MediaRecorder

#### **Test 3: Touch Support**
- Tests if touch events are available
- **Expected:** Touch events supported on mobile
- **If Fails:** Device may not support touch

#### **Test 4: Viewport Size**
- Tests if viewport is mobile-sized
- **Expected:** Width < 768px for mobile
- **If Fails:** Viewport may not be configured correctly

#### **Test 5: Clipboard API**
- Tests if clipboard can be written to
- **Expected:** Clipboard API available
- **If Fails:** Browser may not support Clipboard API

#### **Test 6: Audio Context**
- Tests if Web Audio API is available
- **Expected:** Audio Context available
- **If Fails:** Browser may not support Web Audio

#### **Test 7: Performance API**
- Tests if Performance API is available
- **Expected:** Performance API available
- **If Fails:** Browser may not support Performance API

---

## 📋 **TESTING CHECKLIST**

### **Before Testing:**

- [ ] Open app on real device
- [ ] Open Mobile Test Harness
- [ ] Verify device information is correct
- [ ] Check performance metrics baseline

### **During Testing:**

- [ ] Run all tests
- [ ] Document any failures
- [ ] Monitor performance metrics
- [ ] Take screenshots of issues

### **After Testing:**

- [ ] Document results in `MOBILE_TESTING_REPORT.md`
- [ ] Report bugs found
- [ ] Update `MOBILE_TESTING_DEBT_REGISTER.md`

---

## 🔍 **INTERPRETING RESULTS**

### **Performance Metrics:**

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| FPS | 60 | 50-59 | < 50 |
| Frame Drops | 0 | 1-5 | > 5 |
| Scroll Jank | 0 | 1-3 | > 3 |
| Touch Latency | < 50ms | 50-100ms | > 100ms |
| Initial Render | < 1000ms | 1000-2000ms | > 2000ms |

### **Test Results:**

- **✅ PASS:** Feature works correctly
- **❌ FAIL:** Feature has issues - document and report
- **⏳ PENDING:** Test not yet run

---

## 🐛 **TROUBLESHOOTING**

### **Harness Not Appearing:**

1. Check if you're in development mode
2. Verify the component is imported in `main.tsx`
3. Check browser console for errors

### **Tests Failing:**

1. **Microphone Test Fails:**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Verify device has microphone

2. **MediaRecorder Test Fails:**
   - Check browser support
   - Verify HTTPS (required for MediaRecorder)
   - Check device capabilities

3. **Touch Test Fails:**
   - Verify you're on a touch device
   - Check browser support
   - Verify viewport is mobile-sized

### **Performance Metrics Unusual:**

1. **Low FPS:**
   - Check device performance
   - Close other apps
   - Check for heavy animations

2. **High Touch Latency:**
   - Check device performance
   - Verify no heavy processing
   - Check for event handlers blocking

---

## 📊 **REPORTING RESULTS**

When reporting test results, include:

1. **Device Information:**
   - Device model
   - OS version
   - Browser version
   - Screen size

2. **Test Results:**
   - Which tests passed/failed
   - Error messages (if any)
   - Screenshots (if applicable)

3. **Performance Metrics:**
   - FPS
   - Frame Drops
   - Touch Latency
   - Initial Render Time

4. **Issues Found:**
   - Description
   - Steps to reproduce
   - Expected vs. Actual behavior
   - Screenshots/videos

---

## 🎯 **BEST PRACTICES**

1. **Test on Real Devices:**
   - Always test on actual hardware
   - Emulators may not catch all issues

2. **Test Multiple Devices:**
   - Test on different iPhone models
   - Test on different Android devices
   - Test on tablets

3. **Test Different Browsers:**
   - Safari iOS (required)
   - Chrome Android (required)
   - Other browsers (optional)

4. **Test Different Network Conditions:**
   - WiFi
   - 4G/5G
   - Slow network (if possible)

5. **Document Everything:**
   - Take screenshots
   - Record videos (if helpful)
   - Document all issues found

---

## 📝 **EXAMPLE TEST SESSION**

```
1. Open app on iPhone 13 (Safari iOS 17.0)
2. Open Mobile Test Harness
3. Verify device info:
   - Device Type: mobile ✅
   - Is iOS: Yes ✅
   - Is Safari: Yes ✅
   - Screen: 390x844 ✅
4. Check performance metrics:
   - FPS: 60 ✅
   - Frame Drops: 0 ✅
   - Touch Latency: 25ms ✅
5. Run all tests:
   - Microphone Access: ✅ PASS
   - MediaRecorder Support: ✅ PASS (audio/webm;codecs=opus)
   - Touch Support: ✅ PASS
   - Viewport Size: ✅ PASS
   - Clipboard API: ✅ PASS
   - Audio Context: ✅ PASS
   - Performance API: ✅ PASS
6. Document results in MOBILE_TESTING_REPORT.md
```

---

## ✅ **SUCCESS CRITERIA**

A successful test session should show:

- ✅ All device information correct
- ✅ Performance metrics within acceptable ranges
- ✅ All tests passing
- ✅ No critical issues found

---

**For questions or issues, refer to:**
- `MOBILE_TESTING_REPORT.md` - Full test results
- `MOBILE_TESTING_DEBT_REGISTER.md` - Known issues and validation plan
- `MOBILE_TESTING_EMULATED_REPORT.md` - Emulated test results

---

---

## ✅ **VERIFICATION STATUS (November 20, 2025)**

### **Harness Integration:** ✅ **VERIFIED**

**Location:** `src/components/mobile/MobileTestHarness.tsx`

**Integration Points:**
- ✅ Imported in `src/main.tsx`
- ✅ Rendered conditionally: `{import.meta.env.DEV && <MobileTestHarness />}`
- ✅ MobileViewportFix also integrated
- ✅ Available only in development mode

**Component Status:**
- ✅ Device information detection: Working
- ✅ Performance metrics tracking: Working
- ✅ Automated capability tests: 7 tests implemented
- ✅ Real-time monitoring: Working

### **Instrumentation:** ✅ **VERIFIED**

**Location:** `src/utils/mobileInstrumentation.ts`

**Features:**
- ✅ FPS tracking: Implemented
- ✅ Scroll jank detection: Implemented
- ✅ Touch latency measurement: Implemented
- ✅ Initial render time: Implemented
- ✅ DOM performance metrics: Implemented

### **Mobile Detection:** ✅ **VERIFIED**

**Location:** `src/utils/mobileDetection.ts`

**Features:**
- ✅ Device type detection: Working
- ✅ Platform detection (iOS/Android): Working
- ✅ Browser detection (Safari/Chrome): Working
- ✅ Screen size detection: Working

### **HTTPS Setup:** ✅ **VERIFIED**

**Status:** HTTPS development server configured

**Configuration:**
- ✅ Certificates: `certs/cert.pem` and `certs/key.pem`
- ✅ Script: `npm run dev:https`
- ✅ Port: 5174
- ✅ Host: Enabled for external connections

**Access:**
- Local IP: Available via `ifconfig`
- URL Format: `https://[LOCAL_IP]:5174`
- Certificate: Self-signed (requires trust on mobile devices)

### **Pre-flight Check:** ✅ **VERIFIED**

**Script:** `scripts/mobile-preflight.cjs`

**Checks:**
- ✅ Port availability
- ✅ IPv4 accessibility
- ✅ Certificate validity
- ✅ HTTPS configuration
- ✅ Endpoint availability
- ✅ Performance baseline

**Status:** All checks passing

---

## 🎯 **READINESS FOR REAL DEVICE TESTING**

### **✅ READY:**

- ✅ Mobile Test Harness: Integrated and functional
- ✅ Instrumentation: Capturing FPS, scroll, touch latency
- ✅ HTTPS: Configured and accessible
- ✅ Pre-flight: All checks passing
- ✅ Logs: Visible in console
- ✅ Tests: 7 automated tests ready

### **⚠️ REQUIRES REAL DEVICE:**

- ⚠️ Microphone button: Will be visible on mobile (currently hidden on desktop)
- ⚠️ Permission flow: Requires real device to test Safari iOS policies
- ⚠️ Touch latency: Requires real device to measure accurately
- ⚠️ Performance metrics: Requires real device to validate

---

**Signed:** Implementation Team  
**Date:** November 20, 2025  
**Status:** ✅ **READY FOR REAL DEVICE TESTING - VERIFIED**

