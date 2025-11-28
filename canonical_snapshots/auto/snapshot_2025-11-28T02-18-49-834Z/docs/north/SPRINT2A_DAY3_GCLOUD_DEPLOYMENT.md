# 🚀 DEPLOYMENT VIA GCLOUD CLI

**Método:** gcloud CLI directo (evita análisis de index.js)  
**Tiempo estimado:** 5-10 minutos

---

## 📋 **PREREQUISITOS VERIFICADOS**

- ✅ gcloud CLI instalado: `/opt/homebrew/share/google-cloud-sdk/bin/gcloud`
- ✅ Proyecto configurado: `aiduxcare-v2-uat-dev`
- ✅ Código optimizado: `functions/monthlyTokenReset.js`

---

## 🎯 **DEPLOYMENT STEPS**

### **1. Deploy monthlyTokenReset (Scheduled Function)**

```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

gcloud functions deploy monthlyTokenReset \
  --gen2 \
  --runtime=nodejs20 \
  --region=northamerica-northeast1 \
  --source=functions \
  --entry-point=monthlyTokenReset \
  --trigger-schedule="0 0 1 * *" \
  --schedule-timezone="America/Toronto" \
  --timeout=540s \
  --memory=512MB \
  --max-instances=100 \
  --project=aiduxcare-v2-uat-dev
```

### **2. Deploy manualTokenReset (Callable Function)**

```bash
gcloud functions deploy manualTokenReset \
  --gen2 \
  --runtime=nodejs20 \
  --region=northamerica-northeast1 \
  --source=functions \
  --entry-point=manualTokenReset \
  --trigger-http \
  --allow-unauthenticated=false \
  --timeout=540s \
  --memory=512MB \
  --max-instances=100 \
  --project=aiduxcare-v2-uat-dev
```

---

## ✅ **VERIFICACIÓN**

```bash
# Listar funciones
gcloud functions list --project=aiduxcare-v2-uat-dev --filter="name:tokenReset"

# O con Firebase CLI
firebase functions:list --project aiduxcare-v2-uat-dev | grep -i token
```

---

## 🔍 **TROUBLESHOOTING**

### **Error: "Function failed to deploy"**
- Verifica que `functions/monthlyTokenReset.js` existe
- Verifica que `functions/package.json` tiene las dependencias correctas
- Revisa los logs: `gcloud functions logs read monthlyTokenReset --region=northamerica-northeast1`

### **Error: "Entry point not found"**
- Verifica que el archivo exporta `exports.monthlyTokenReset` y `exports.manualTokenReset`
- Verifica que el nombre del entry-point coincide con el export

### **Error: "Region not available"**
- Verifica que la región `northamerica-northeast1` está habilitada
- Lista regiones disponibles: `gcloud functions regions list`

---

**Status:** ✅ **READY TO DEPLOY**

