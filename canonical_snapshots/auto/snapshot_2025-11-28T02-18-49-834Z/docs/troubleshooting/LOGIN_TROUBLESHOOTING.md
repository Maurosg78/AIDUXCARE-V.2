# Login Troubleshooting Guide

**Last Updated:** November 2025  
**Status:** Consolidated guide for all login-related issues

---

## 📋 Overview

This guide consolidates all login troubleshooting information, including canonical file management and cache issues.

---

## 🔧 Common Issues

### 1. Wrong Login Page Loading

**Problem:** Incorrect login page appears despite correct code

**Solutions:**
- Clear browser cache (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
- Clear service worker cache
- Check canonical file: `src/pages/LoginPage.tsx`
- Verify router configuration: `src/router/router.tsx`

**Canonical File:**
- `src/pages/LoginPage.tsx` - Single source of truth
- All other login pages should be quarantined

### 2. Aggressive Cache Issues

**Problem:** Old UI rendering despite code changes

**Solutions:**
- Clear browser cache completely
- Disable service worker in DevTools
- Use incognito mode for testing
- Check `public/sw.js` or service worker registration

### 3. Credential Issues

**Problem:** Login fails with correct credentials

**Solutions:**
- Verify Firebase Auth configuration
- Check Firestore security rules
- Verify user exists in Firebase Console
- Check browser console for errors

---

## 📁 Canonical Files

**Login Page:**
- `src/pages/LoginPage.tsx` - **CANONICAL**

**Quarantined Files:**
- Check `ARCHIVOS_CANONICOS.md` for list of non-canonical files

---

## 📚 Related Documents

- `ARCHIVOS_CANONICOS.md` - Canonical file management
- `SISTEMA_CUARENTENA_COMPLETADO.md` - Quarantine system
- `CANONICAL_FILES_VERIFICATION.md` - Verification process

---

**For detailed information, see individual troubleshooting documents in this folder.**
