# ✅ **CHECKLIST CTO – VALIDACIÓN EN IPHONE (Sprint 1)**

**Fecha:** _______________  
**Dispositivo:** iPhone _______________  
**iOS Version:** _______________  
**Safari Version:** _______________  
**Ambiente:** Dev (HTTPS local)

---

## **📋 INSTRUCCIONES PRE-VALIDACIÓN**

### **Preparación:**
1. ✅ Servidor dev corriendo (`npm run dev`)
2. ✅ HTTPS configurado y certificado instalado en iPhone
3. ✅ `VITE_DEV_PUBLIC_URL` configurado en `.env`
4. ✅ iPhone conectado a la misma red WiFi
5. ✅ Safari abierto y listo

### **Orden de ejecución:**
- Ejecutar en el orden indicado
- Marcar ✅ si pasa, ❌ si falla
- Anotar detalles en "Notas" si es necesario

---

## **1. MSK TESTS – Verificación Clínica (CRÍTICO)** ⚠️

### 🎯 **Caso a probar:**
**Dolor lumbar → análisis → Physical Tests → SOAP**

### **Pasos:**
1. Abrir Workflow Page
2. Grabar/transcribir: "Patient has low back pain radiating to left leg"
3. Esperar análisis de Niagara
4. Seleccionar **4 tests lumbares** (ej: SLR, Kemp's, Lumbar Flexion, Lumbar Extension)
5. Continuar a Physical Evaluation
6. Evaluar los tests
7. Generar SOAP
8. Revisar Objective section

### ✔ **Debe ocurrir:**
- [ ] Seleccionas solo tests lumbares
- [ ] En "Physical Evaluation" aparecen **exactamente los mismos 4 tests**
- [ ] NO aparece ningún test de muñeca / cervical / hombro / codo / pie / mano
- [ ] El SOAP Objective **solo describe lo lumbar**
- [ ] Cero referencias a regiones no testeadas

### ❌ **Error si ocurre:**
- [ ] Aparecen más tests de los seleccionados
- [ ] SOAP menciona muñeca, hombro u otra región

### 📝 **Notas:**
```
Tests seleccionados: _______________________
Tests que aparecieron: _______________________
Regiones mencionadas en SOAP: _______________________
```

**Resultado:** ✅ PASA / ❌ FALLA

---

## **2. CLINICAL VAULT – Guardado y Aparición (CRÍTICO)** ⚠️

### 🎯 **Caso a probar:**
1. Generar SOAP completo
2. Finalizar nota (click "Finalize" o equivalente)
3. Ir a **Clinical Vault** (`/documents`)

### **Pasos:**
1. Completar SOAP en Workflow
2. Click "Finalize" / "Save"
3. Navegar a Clinical Vault
4. Verificar que la nota aparece

### ✔ **Debe ocurrir:**
- [ ] La nota aparece inmediatamente
- [ ] Muestra fecha correcta
- [ ] Muestra tipo (Initial Assessment / Follow-up)
- [ ] Muestra preview del texto
- [ ] Permite buscar por texto
- [ ] Permite abrir la nota completa

### ❌ **Error si ocurre:**
- [ ] "No notes yet" aparece
- [ ] La nota aparece solo a veces (inconsistente)
- [ ] No muestra preview
- [ ] Fecha incorrecta o ausente

### 📝 **Notas:**
```
Nota finalizada a las: _______________________
Apareció en Vault: SÍ / NO
Tiempo de aparición: _______________________
Preview visible: SÍ / NO
```

**Resultado:** ✅ PASA / ❌ FALLA

---

## **3. CONSENTIMIENTO INFORMADO – Flujo Móvil** ⚠️

### 🎯 **Caso a probar:**
En Command Center:
- Click en "Open consent portal"
- Click en "Copy consent link"
- Abrir link en Safari (pestaña nueva)

### **Pasos:**
1. Ir a Command Center
2. Seleccionar paciente sin consentimiento
3. Click "Open consent portal"
4. Verificar que abre en Safari
5. Volver a Command Center
6. Click "Copy consent link"
7. Pegar en Notas y abrir

### ✔ **Debe ocurrir:**
- [ ] Abre siempre en iPhone (no error de conexión)
- [ ] Usa IP local + HTTPS instalado
- [ ] Muestra portal limpio y funcional
- [ ] Solo **un** banner de advertencia (no duplicado)
- [ ] Colores AiduxCare (rojo suave `bg-red-50`, `text-red-800`)
- [ ] Botones correctos (gradiente brand, NO negros)
- [ ] Permite firmar (aunque sea mock)

### ❌ **Error si ocurre:**
- [ ] Página no carga ("Cannot connect to server")
- [ ] Página en blanco
- [ ] Popup repetido (2-3 veces)
- [ ] Colores rojos incorrectos
- [ ] Botones en negro
- [ ] Link no funciona

### 📝 **Notas:**
```
Link generado: _______________________
¿Abre correctamente? SÍ / NO
Banners visibles: _______________________
Colores observados: _______________________
```

**Resultado:** ✅ PASA / ❌ FALLA

---

## **4. COMMAND CENTER – English Only** ⚠️

### 🎯 **Abrir Command Center:**
Navegar a `/command-center` y revisar TODOS los textos visibles

### **Pasos:**
1. Abrir Command Center
2. Revisar todos los textos visibles
3. Abrir modales (New Appointment, New Patient, etc.)
4. Revisar overlays y botones

### ✔ **Debe estar TODO en inglés:**
- [ ] "Create Appointment"
- [ ] "Weekly Schedule"
- [ ] "Patient List"
- [ ] "New Patient"
- [ ] "Appointment details"
- [ ] "Consent"
- [ ] Todos los botones
- [ ] Todos los modales
- [ ] Todos los mensajes

### ❌ **Error:**
- [ ] Cualquier texto en español visible
- [ ] Botones negros (`bg-black`, `text-black`)
- [ ] Fondos negros (`bg-black`)
- [ ] Overlays opacos negros

### 📝 **Notas:**
```
Textos en español encontrados: _______________________
Botones negros encontrados: _______________________
Overlays negros encontrados: _______________________
```

**Resultado:** ✅ PASA / ❌ FALLA

---

## **5. COPY TO CLIPBOARD vs DOWNLOAD .TXT** ⚠️

### 🎯 **Caso:**
1. Generar SOAP completo
2. Presionar **Copy to Clipboard**
3. Pegar en Notas o WhatsApp
4. Descargar `.txt` y abrirlo
5. Comparar ambos textos

### **Pasos:**
1. Generar SOAP en Workflow
2. Click "Copy to Clipboard"
3. Abrir Notas app
4. Pegar contenido
5. Volver a SOAP Editor
6. Click "Download .txt"
7. Abrir archivo descargado
8. Comparar ambos textos (carácter por carácter)

### ✔ **Debe ocurrir:**
- [ ] Ambos textos son **idénticos** (bit-for-bit)
- [ ] El copy funciona en iPhone (no error)
- [ ] Los subtítulos explican la función:
  - [ ] "Paste into your EMR" visible
  - [ ] "Save as text file" visible
- [ ] Download se descarga correctamente

### ❌ **Error:**
- [ ] Diferencia entre texto copiado y descargado
- [ ] Copy no funciona (error de permisos)
- [ ] Download no se descarga
- [ ] Subtítulos no visibles o incorrectos

### 📝 **Notas:**
```
Copy funcionó: SÍ / NO
Download funcionó: SÍ / NO
Textos idénticos: SÍ / NO
Diferencias encontradas: _______________________
```

**Resultado:** ✅ PASA / ❌ FALLA

---

## **6. OVERLAYS Y BOTONES NEGROS** ⚠️

### 🎯 **Acciones:**
Abrir cualquier modal:
- New Appointment
- Edit SOAP
- Feedback
- Error modal
- New Patient
- Preferences

### **Pasos:**
1. Abrir cada modal mencionado
2. Observar overlay (fondo)
3. Observar botones
4. Observar textos

### ✔ **Debe ocurrir:**
- [ ] Fondo semitransparente gris (`bg-gray-900/50`)
- [ ] Botones con gradiente o outline brand
- [ ] Ningún botón negro
- [ ] Ningún texto negro fuera de palette

### ❌ **Error:**
- [ ] Overlay totalmente negro (`bg-black`)
- [ ] Texto negro duro (`text-black`)
- [ ] Botones negros (`bg-black`)

### 📝 **Notas:**
```
Modales probados: _______________________
Overlays incorrectos: _______________________
Botones negros encontrados: _______________________
```

**Resultado:** ✅ PASA / ❌ FALLA

---

## **📊 RESUMEN DE VALIDACIÓN**

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 1 | MSK Tests | ⬜ PASA / ⬜ FALLA | |
| 2 | Clinical Vault | ⬜ PASA / ⬜ FALLA | |
| 3 | Consentimiento | ⬜ PASA / ⬜ FALLA | |
| 4 | Command Center | ⬜ PASA / ⬜ FALLA | |
| 5 | Copy vs Download | ⬜ PASA / ⬜ FALLA | |
| 6 | Overlays/Botones | ⬜ PASA / ⬜ FALLA | |

**Total:** ___/6 pasan

---

## **🎯 DECISIÓN CTO**

### 🟩 **Si todos pasan (6/6):**
- ✅ **Sprint 1 VALIDADO**
- ✅ **Liberar Sprint 2**
- ✅ Generar orden para Sprint 2

### 🟥 **Si alguno falla:**
- ❌ **Sprint 1 REQUIERE HOTFIX**
- ❌ **NO liberar Sprint 2**
- ❌ Generar orden de corrección inmediata

---

## **📝 OBSERVACIONES ADICIONALES**

```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

**Validado por:** _______________  
**Fecha:** _______________  
**Hora:** _______________

