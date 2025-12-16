# ⚡ **QUICK START – VALIDACIÓN CTO EN IPHONE**

Guía rápida para ejecutar la validación del Sprint 1 en 10-15 minutos.

---

## **🚀 PREPARACIÓN (2 minutos)**

### **1. Verificar servidor dev:**
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
npm run dev
```

### **2. Verificar IP local:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Anotar la IP (ej: 192.168.1.100)
```

### **3. Verificar .env:**
```bash
cat .env | grep VITE_DEV_PUBLIC_URL
# Debe mostrar: VITE_DEV_PUBLIC_URL=https://TU_IP:5174
```

### **4. Abrir en iPhone:**
- Safari → `https://TU_IP:5174`
- Aceptar certificado si es necesario

---

## **✅ CHECKLIST RÁPIDO (10 minutos)**

### **Test 1: MSK Tests (2 min)**
1. Workflow → Grabar: "low back pain"
2. Seleccionar 4 tests lumbares
3. Physical Evaluation → Verificar que solo aparecen esos 4
4. Generar SOAP → Verificar Objective (sin muñeca)

**✅ PASA / ❌ FALLA**

---

### **Test 2: Clinical Vault (2 min)**
1. Finalizar SOAP
2. Ir a Clinical Vault (`/documents`)
3. Verificar que la nota aparece

**✅ PASA / ❌ FALLA**

---

### **Test 3: Consentimiento (2 min)**
1. Command Center → Paciente sin consentimiento
2. Click "Open consent portal"
3. Verificar que abre en Safari
4. Verificar banner único, colores correctos

**✅ PASA / ❌ FALLA**

---

### **Test 4: Command Center (1 min)**
1. Abrir Command Center
2. Revisar que TODO está en inglés
3. Abrir modales → Verificar overlays grises

**✅ PASA / ❌ FALLA**

---

### **Test 5: Copy vs Download (2 min)**
1. Generar SOAP
2. Copy to Clipboard → Pegar en Notas
3. Download .txt → Abrir archivo
4. Comparar textos (deben ser idénticos)

**✅ PASA / ❌ FALLA**

---

### **Test 6: Overlays (1 min)**
1. Abrir cualquier modal
2. Verificar overlay gris (`bg-gray-900/50`)
3. Verificar botones (gradiente, NO negros)

**✅ PASA / ❌ FALLA**

---

## **📊 RESULTADO FINAL**

**Total:** ___/6 pasan

### **🟩 Si 6/6 pasan:**
✅ **SPRINT 1 VALIDADO**  
✅ **Liberar Sprint 2**

### **🟥 Si alguno falla:**
❌ **SPRINT 1 REQUIERE HOTFIX**  
❌ **NO liberar Sprint 2**

---

## **📝 DOCUMENTAR RESULTADOS**

Usar:
- `CTO_VALIDATION_CHECKLIST.md` (checklist detallado)
- `CTO_VALIDATION_REPORT_TEMPLATE.md` (reporte completo)

---

## **🔧 SI ALGO FALLA**

Ver:
- `CTO_DEBUGGING_COMMANDS.md` (comandos de debugging)

---

**Tiempo estimado:** 10-15 minutos  
**Última actualización:** _______________

