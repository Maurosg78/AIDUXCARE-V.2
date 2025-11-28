# Twilio Setup & Troubleshooting Guide

**Last Updated:** November 2025  
**Status:** Consolidated guide for all Twilio-related issues

---

## 📋 Overview

This guide consolidates all Twilio setup, configuration, and troubleshooting information for the AiduxCare SMS consent system.

---

## 🔧 Setup

### Initial Configuration

1. **Environment Variables Required:**
   ```env
   VITE_TWILIO_ACCOUNT_SID=your_account_sid
   VITE_TWILIO_AUTH_TOKEN=your_auth_token
   VITE_TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
   ```

2. **Phone Number Format:**
   - Must be E.164 format: `+1` followed by 10 digits
   - Example: `+16474240008`
   - No spaces or special characters

3. **Verification:**
   - Check console logs for configuration status
   - Look for: `[SMS SERVICE] Twilio Configuration:`

---

## ⚠️ Common Issues

### 1. Trial Account Limitations

**Problem:** SMS not delivered to Canadian numbers from US Twilio number

**Solution:**
- Upgrade Twilio account from trial to paid
- Purchase Canadian phone number (area code 647, 416, or 437)
- Update `VITE_TWILIO_PHONE_NUMBER` with new Canadian number

**Note:** Trial accounts can only send to verified numbers

### 2. Invalid Phone Number Format

**Problem:** `Invalid 'To' Phone Number` error

**Solution:**
- Ensure phone number is in E.164 format
- Remove spaces and special characters
- For North America: `+1` + 10 digits = 12 characters total

### 3. SMS Not Delivered

**Problem:** SMS sent but not received

**Check:**
- Twilio Console → Logs → Messaging
- Verify phone number in Twilio Console
- Check for "domestic-only" restrictions
- Verify account is not in trial mode (if sending to unverified numbers)

---

## 📚 Related Documents

- `TWILIO_SMS_SETUP.md` - Detailed setup instructions
- `TWILIO_CREDENTIALS_CHECK.md` - Credential verification
- `TWILIO_VERIFICACION_TRIAL_LIMITACIONES.md` - Trial account details
- `TWILIO_VERIFICACION_NUMERO_CANADA.md` - Canadian number verification

---

**For detailed information, see individual troubleshooting documents in this folder.**
