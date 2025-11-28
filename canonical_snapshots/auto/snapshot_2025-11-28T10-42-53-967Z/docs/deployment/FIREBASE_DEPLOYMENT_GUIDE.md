# Firebase Deployment Guide

**Last Updated:** November 2025  
**Status:** Consolidated guide for all Firebase deployment operations

---

## 📋 Overview

This guide consolidates all Firebase deployment instructions, including Firestore indexes, security rules, and CLI setup.

---

## 🚀 Quick Start

### 1. Firebase CLI Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not already done)
firebase init
```

### 2. Deploy Firestore Indexes

```bash
# Deploy indexes from firestore.indexes.json
firebase deploy --only firestore:indexes
```

### 3. Deploy Firestore Rules

```bash
# Deploy rules from firestore.rules
firebase deploy --only firestore:rules
```

---

## 📚 Detailed Guides

### Firestore Indexes

- **Setup:** `FIRESTORE_CLI_SETUP.md`
- **Value Analytics:** `FIRESTORE_VALUE_ANALYTICS_SETUP.md`
- **Index Solution:** `SOLUCION_FINAL_INDICES.md`

### Manual Deployment

- **Manual Guide:** `GUIA_DEPLOY_MANUAL_FIREBASE.md`
- **Deploy Instructions:** `DEPLOY_INSTRUCTIONS_FIREBASE.md`

---

## ⚠️ Common Issues

### Index Creation Errors

**Problem:** "The query requires an index" error

**Solution:**
1. Check `firestore.indexes.json` for required indexes
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Or create manually in Firebase Console

### Rules Deployment Errors

**Problem:** Rules deployment fails

**Solution:**
1. Validate rules: `firebase firestore:rules:validate`
2. Test rules: `firebase firestore:rules:test`
3. Deploy: `firebase deploy --only firestore:rules`

---

## 📝 Related Documents

- `FIRESTORE_INDEXES.md` - Index reference
- Individual setup guides in this folder

---

**For detailed information, see individual deployment documents in this folder.**
