# 🔐 SSL Certificate Setup - Universal Certificate

## Overview

This project uses a **universal SSL certificate** that works with multiple IP addresses, eliminating the need to regenerate certificates every time your network IP changes.

## Certificate Features

✅ **Works with multiple IPs:**
- `localhost` and `127.0.0.1`
- Common local network IPs (192.168.0.x, 192.168.1.x, 192.168.2.x, 10.0.0.x)
- Domain: `aiduxcare.local` (via mDNS)

✅ **Valid for 10 years** (no need to regenerate frequently)

✅ **Auto-updates** `VITE_DEV_PUBLIC_URL` when starting the server

## Initial Setup

### 1. Generate Universal Certificate

Run once (or whenever you need to regenerate):

```bash
./scripts/generate-ssl-cert-universal.sh
```

This creates a certificate with:
- Multiple common local IP addresses
- `aiduxcare.local` domain
- 10-year validity

### 2. Install Certificate on iPhone

1. **Start the dev server:**
   ```bash
   npm run dev:https
   ```

2. **On iPhone, open Safari and navigate to:**
   - `https://[YOUR_IP]:5174` (e.g., `https://192.168.1.171:5174`)
   - OR `https://aiduxcare.local:5174` (if mDNS is configured)

3. **Install certificate:**
   - Tap "Advanced" → "Proceed to site" (if warning appears)
   - Go to **Settings → General → About → Certificate Trust Settings**
   - Enable trust for "aiduxcare.local"

## Daily Usage

### Starting the Server

Simply run:

```bash
npm run dev:https
```

This automatically:
1. ✅ Updates `VITE_DEV_PUBLIC_URL` with current IP
2. ✅ Validates environment variables
3. ✅ Starts HTTPS server on port 5174

### Accessing from iPhone

The certificate works with **any IP** in the common ranges:
- `https://192.168.0.x:5174`
- `https://192.168.1.x:5174`
- `https://192.168.2.x:5174`
- `https://10.0.0.x:5174`
- `https://aiduxcare.local:5174` (if mDNS configured)

**No need to regenerate certificate when IP changes!**

## Scripts Reference

### `generate-ssl-cert-universal.sh`
Generates universal certificate with multiple IPs.

**Usage:**
```bash
./scripts/generate-ssl-cert-universal.sh
```

**When to run:**
- Initial setup
- If certificate expires (after 10 years)
- If you need to add more IPs

### `update-dev-url.sh`
Updates `VITE_DEV_PUBLIC_URL` in `.env.local` with current IP.

**Usage:**
```bash
./scripts/update-dev-url.sh
```

**When to run:**
- Automatically called by `npm run dev:https`
- Manually if you need to update URL without starting server

### `generate-ssl-cert.sh` (Legacy)
Generates certificate for single IP (not recommended).

**Usage:**
```bash
./scripts/generate-ssl-cert.sh [IP_ADDRESS]
```

## Troubleshooting

### Certificate Not Trusted on iPhone

1. **Verify certificate is installed:**
   - Settings → General → About → Certificate Trust Settings
   - Should see "aiduxcare.local" listed

2. **Reinstall certificate:**
   - Delete old certificate from iPhone
   - Navigate to `https://[IP]:5174` again
   - Follow installation steps

### IP Not in Certificate

If your IP is not in the common ranges, you can:

1. **Add it manually:**
   - Edit `scripts/generate-ssl-cert-universal.sh`
   - Add your IP to the IP list
   - Regenerate certificate

2. **Use domain instead:**
   - Add to `/etc/hosts`: `[YOUR_IP]  aiduxcare.local`
   - Use `https://aiduxcare.local:5174`

### Certificate Expired

Regenerate with:
```bash
./scripts/generate-ssl-cert-universal.sh
```

## Certificate Details

**Location:** `certs/cert.pem` and `certs/key.pem`

**Validity:** 10 years (3650 days)

**Subject:** `CN=aiduxcare.local`

**Subject Alternative Names:**
- DNS: localhost, *.localhost, aiduxcare.local, *.aiduxcare.local
- IP: Multiple common local network IPs (see script for full list)

## Security Note

⚠️ **This is a self-signed certificate for development only.**

**DO NOT use in production!** Production should use:
- Let's Encrypt certificates
- Cloud provider SSL certificates (Firebase Hosting, etc.)

## Related Files

- `vite.config.https.ts` - Vite HTTPS configuration
- `scripts/generate-ssl-cert-universal.sh` - Certificate generator
- `scripts/update-dev-url.sh` - URL updater
- `.env.local` - Environment variables (includes `VITE_DEV_PUBLIC_URL`)

