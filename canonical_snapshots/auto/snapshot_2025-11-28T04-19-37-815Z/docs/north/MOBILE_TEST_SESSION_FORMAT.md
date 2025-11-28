# 📱 **MOBILE TEST SESSION FORMAT — JSON SCHEMA**

**Date:** November 2025  
**Status:** ✅ **SCHEMA DEFINED**  
**Purpose:** Standardized format for mobile testing session data

---

## 🎯 **PURPOSE**

Define a JSON format for recording mobile testing sessions that can be:
- Copied/pasted from test execution
- Timestamped automatically
- Duration tracked
- Results documented
- Analyzed by CTO

---

## 📋 **JSON SCHEMA**

```json
{
  "sessionId": "string",
  "timestamp": "ISO 8601 datetime",
  "device": {
    "type": "iPhone | iPad | Android",
    "model": "string",
    "os": "string",
    "browser": "Safari | Chrome",
    "screen": "widthxheight",
    "network": "WiFi | Cellular"
  },
  "environment": {
    "serverUrl": "https://ip:port",
    "certificateTrusted": true | false,
    "localIP": "string"
  },
  "tests": [
    {
      "testId": "string",
      "phase": "1 | 2 | 3 | 4 | 5",
      "testName": "string",
      "startTime": "ISO 8601 datetime",
      "endTime": "ISO 8601 datetime",
      "duration": "number (seconds)",
      "status": "PASS | FAIL | SKIP",
      "result": "string",
      "screenshots": ["url1", "url2"],
      "notes": "string",
      "bugs": [
        {
          "bugId": "string",
          "severity": "CRITICAL | HIGH | MEDIUM | LOW",
          "description": "string",
          "stepsToReproduce": "string[]",
          "expected": "string",
          "actual": "string"
        }
      ]
    }
  ],
  "performance": {
    "fps": "number",
    "frameDrops": "number",
    "touchLatency": "number (ms)",
    "initialRender": "number (ms)",
    "pipelineLatency": "number (ms)"
  },
  "summary": {
    "totalTests": "number",
    "passed": "number",
    "failed": "number",
    "skipped": "number",
    "criticalBugs": "number",
    "goNoGo": "GO | NO-GO | CONDITIONAL"
  }
}
```

---

## 📝 **EXAMPLE SESSION**

```json
{
  "sessionId": "mobile-test-2025-11-20-iphone-001",
  "timestamp": "2025-11-20T22:15:00Z",
  "device": {
    "type": "iPhone",
    "model": "iPhone 14 Pro",
    "os": "iOS 17.1",
    "browser": "Safari",
    "screen": "390x663",
    "network": "WiFi"
  },
  "environment": {
    "serverUrl": "https://172.20.10.11:5175",
    "certificateTrusted": true,
    "localIP": "172.20.10.11"
  },
  "tests": [
    {
      "testId": "test-1.1",
      "phase": 1,
      "testName": "HTTPS Access",
      "startTime": "2025-11-20T22:15:05Z",
      "endTime": "2025-11-20T22:15:08Z",
      "duration": 3,
      "status": "PASS",
      "result": "Page loaded successfully",
      "screenshots": [],
      "notes": "Certificate trusted without issues",
      "bugs": []
    },
    {
      "testId": "test-2.1",
      "phase": 2,
      "testName": "Microphone Access",
      "startTime": "2025-11-20T22:15:10Z",
      "endTime": "2025-11-20T22:15:12Z",
      "duration": 2,
      "status": "PASS",
      "result": "Microphone permission granted",
      "screenshots": [],
      "notes": "Working correctly with HTTPS",
      "bugs": []
    }
  ],
  "performance": {
    "fps": 60,
    "frameDrops": 0,
    "touchLatency": 0.00,
    "initialRender": 0.00,
    "pipelineLatency": null
  },
  "summary": {
    "totalTests": 2,
    "passed": 2,
    "failed": 0,
    "skipped": 0,
    "criticalBugs": 0,
    "goNoGo": "GO"
  }
}
```

---

## 🔧 **USAGE**

### **Manual Entry:**

During real device testing, fill in the JSON as you execute tests:

1. Start session: Create JSON with session info
2. For each test: Add test object with results
3. End session: Complete summary and go/no-go

### **Automated Generation:**

Future: Script can generate JSON from test execution logs.

---

## 📋 **FIELD DESCRIPTIONS**

### **Session Level:**

- **sessionId:** Unique identifier (e.g., `mobile-test-2025-11-20-iphone-001`)
- **timestamp:** ISO 8601 datetime of session start
- **device:** Device information
- **environment:** Server and network info
- **tests:** Array of test results
- **performance:** Performance metrics
- **summary:** Overall session summary

### **Test Level:**

- **testId:** Unique test identifier (e.g., `test-1.1`)
- **phase:** Testing phase (1-5)
- **testName:** Human-readable test name
- **startTime/endTime:** ISO 8601 datetimes
- **duration:** Duration in seconds
- **status:** PASS / FAIL / SKIP
- **result:** Test result description
- **screenshots:** Array of screenshot URLs/paths
- **notes:** Additional notes
- **bugs:** Array of bugs found

### **Bug Level:**

- **bugId:** Unique bug identifier
- **severity:** CRITICAL / HIGH / MEDIUM / LOW
- **description:** Bug description
- **stepsToReproduce:** Array of steps
- **expected:** Expected behavior
- **actual:** Actual behavior

---

## 📊 **SUMMARY CALCULATION**

### **Go/No-Go Criteria:**

- **GO:** All critical tests pass, no critical bugs, performance acceptable
- **NO-GO:** Critical tests fail, critical bugs found, performance unacceptable
- **CONDITIONAL:** Some issues but with workarounds

---

**Signed:** Implementation Team  
**Date:** November 2025  
**Status:** ✅ **SCHEMA DEFINED - READY FOR USE**

