# 🔧 CÓMO CREAR FUNCIONES EN FIREBASE CONSOLE

**Problema:** No se puede crear funciones desde Firebase Console  
**Solución:** Sigue estos pasos

---

## 🔍 **UBICACIÓN DEL BOTÓN "CREAR FUNCIÓN"**

### **Opción 1: Botón Principal (Arriba a la Derecha)**

1. En la página de Functions, mira **arriba a la derecha**
2. Busca un botón que diga:
   - **"Crear función"** (español)
   - **"Create function"** (inglés)
   - **"Add function"** (alternativo)
   - Puede tener un ícono **"+"** o **"Add"**

### **Opción 2: Menú de Tres Puntos**

1. Busca un menú de **tres puntos** (⋮) o **menú de opciones**
2. Click en el menú
3. Selecciona **"Crear función"** o **"Create function"**

### **Opción 3: Si No Aparece el Botón**

Puede ser que necesites:

#### **A. Habilitar Cloud Functions API:**
1. Ve a: https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=aiduxcare-v2-uat-dev
2. Click en **"Habilitar"** o **"Enable"**
3. Espera 1-2 minutos
4. Refresca la página de Functions

#### **B. Verificar Permisos:**
- Necesitas rol de **"Editor"** o **"Owner"** en el proyecto
- Verifica en: https://console.cloud.google.com/iam-admin/iam?project=aiduxcare-v2-uat-dev

#### **C. Verificar Plan de Facturación:**
- Cloud Functions requiere plan **Blaze** (pay-as-you-go)
- Ve a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/usage/details
- Si no está habilitado, hazlo (tiene tier gratuito generoso)

---

## 🚀 **ALTERNATIVA: USAR CLOUD CONSOLE DIRECTAMENTE**

Si Firebase Console no funciona, usa Google Cloud Console directamente:

### **1. Abrir Cloud Functions:**
```
https://console.cloud.google.com/functions/list?project=aiduxcare-v2-uat-dev
```

### **2. Crear Función:**
1. Click en **"CREATE FUNCTION"** o **"CREAR FUNCIÓN"**
2. Selecciona **"2nd gen"** (segunda generación)
3. Configura:
   - **Function name:** `monthlyTokenReset`
   - **Region:** `northamerica-northeast1`
   - **Trigger type:** Cloud Scheduler
   - **Schedule:** `0 0 1 * *`
   - **Timezone:** `America/Toronto`
   - **Runtime:** Node.js 20
   - **Entry point:** `monthlyTokenReset`
   - **Source code:** Inline editor
   - **Memory:** 512 MB
   - **Timeout:** 540 seconds

### **3. Código:**
Copia el código desde `docs/north/SPRINT2A_DAY3_CODIGO_COMPLETO.md`

---

## 📋 **VERIFICAR ESTADO DEL PROYECTO**

### **Checklist:**
- [ ] Cloud Functions API habilitada
- [ ] Cloud Build API habilitada
- [ ] Plan Blaze activado
- [ ] Permisos de Editor/Owner
- [ ] Proyecto correcto seleccionado (`aiduxcare-v2-uat-dev`)

---

## 🔧 **SI NADA FUNCIONA**

### **Última Opción: Deployment Manual via gcloud con archivo YAML**

Puedo crear un archivo de configuración YAML que puedas usar para deployment directo. ¿Quieres que lo prepare?

---

**¿Qué mensaje de error ves cuando intentas crear la función?**  
**¿Aparece algún botón o solo ves la lista de funciones?**

