# ⚡ QUICK REFERENCE: Firebase Console Deployment

**Guía Rápida - 5 Minutos**

---

## 🎯 **URL INICIAL**

```
https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions
```

---

## 📋 **CONFIGURACIÓN RÁPIDA**

### **monthlyTokenReset (Scheduled)**

| Campo | Valor |
|-------|-------|
| **Name** | `monthlyTokenReset` |
| **Region** | `northamerica-northeast1` ⚠️ |
| **Trigger** | Cloud Scheduler |
| **Schedule** | `0 0 1 * *` |
| **Timezone** | `America/Toronto` |
| **Runtime** | Node.js 20 |
| **Memory** | 512 MB |
| **Timeout** | 540 seconds |
| **Source** | Inline editor (copia `monthlyTokenReset.js`) |

### **manualTokenReset (Callable)**

| Campo | Valor |
|-------|-------|
| **Name** | `manualTokenReset` |
| **Region** | `northamerica-northeast1` ⚠️ |
| **Trigger** | HTTPS (Callable) |
| **Authentication** | ✅ Required |
| **Runtime** | Node.js 20 |
| **Memory** | 512 MB |
| **Timeout** | 540 seconds |
| **Source** | Inline editor (copia `monthlyTokenReset.js`) |

---

## 📝 **CÓDIGO A COPIAR**

**Archivo:** `functions/monthlyTokenReset.js`

Copia TODO el contenido del archivo en el editor inline de Firebase Console.

---

## ✅ **VERIFICACIÓN RÁPIDA**

```bash
firebase functions:list --project aiduxcare-v2-uat-dev | grep token
```

**Resultado esperado:**
```
monthlyTokenReset  | schedule | northamerica-northeast1 | ✅
manualTokenReset   | callable | northamerica-northeast1 | ✅
```

---

## 🚨 **PUNTOS CRÍTICOS**

1. ⚠️ **REGION:** Debe ser `northamerica-northeast1` (PHIPA compliance)
2. ⚠️ **SCHEDULE:** Formato exacto `0 0 1 * *`
3. ⚠️ **TIMEZONE:** `America/Toronto` (no UTC)
4. ⚠️ **AUTHENTICATION:** Required para `manualTokenReset`

---

**Guía completa:** Ver `SPRINT2A_DAY3_FIREBASE_CONSOLE_DEPLOYMENT.md`

