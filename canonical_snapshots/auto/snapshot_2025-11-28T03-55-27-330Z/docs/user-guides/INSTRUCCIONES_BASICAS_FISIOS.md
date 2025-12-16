# 📋 Instrucciones Básicas para Fisios - Testeo de 1 Mes

**Versión Demo:** Beta Testing - Noviembre 2025  
**Duración del Testeo:** 1 mes  
**Propósito:** Recopilar feedback real para mejorar AiDuxCare

---

## 🚀 QUICK START

### **1. Acceso**
- **URL:** [URL de la demo será proporcionada]
- **Login:** Usar credenciales de prueba
- **Navegador:** Chrome/Firefox/Safari recomendado

### **2. Flujo Básico**

#### **Paso 1: Inicial Analysis (Captura de Audio)**
1. Click en tab **"1 · Initial Analysis"**
2. Click en botón **"🎤 Start Recording"**
3. Habla normalmente durante la consulta
4. El sistema transcribe automáticamente en tiempo real
5. Click en **"⏹ Stop Recording"** cuando termines

**Tips:**
- Habla claro y natural
- El sistema detecta automáticamente el idioma
- Puedes pausar y continuar la grabación

#### **Paso 2: Physical Evaluation (Tests Físicos)**
1. Click en tab **"2 · Physical Evaluation"**
2. Busca tests por región (Shoulder, Knee, Hip, etc.)
3. Selecciona un test de la biblioteca
4. Completa los campos:
   - **ROM (Range of Motion)**: Valores numéricos pre-rellenados con rangos normales
   - **Strength**: Valores numéricos pre-rellenados
   - **Result**: Normal / Positive / Negative / Inconclusive
   - **Notes**: Agregar notas específicas si es necesario
5. Click en **"Add Notes"** para cada test

**Tips:**
- Los valores numéricos vienen pre-rellenados con rangos normales
- Si modificas los valores, significa que NO son normales
- Puedes agregar múltiples tests por sesión

#### **Paso 3: SOAP Report (Generación de Nota Clínica)**
1. Click en tab **"3 · SOAP Report"**
2. Click en **"Generate SOAP Note"**
3. **⚠️ IMPORTANTE - Primera vez:**
   - Verás un modal de consentimiento para procesamiento AI
   - Lee y acepta para continuar (requerido por PHIPA)
4. El sistema genera automáticamente la nota SOAP
5. **⚠️ IMPORTANTE - AI-Generated SOAP:**
   - Verás un badge amarillo "Review Required - CPO Compliance"
   - Click en **"Mark as Reviewed"** antes de finalizar
   - Marca el checkbox "I have reviewed and verified this SOAP note"
6. Edita la nota si es necesario (todos los campos son editables)
7. Click en **"Finalize SOAP Note"** cuando estés listo

**Tips:**
- Siempre puedes re-editar una nota finalizada
- Usa **"Preview"** para ver cómo se verá la nota final
- Usa **"Copy to Clipboard"** o **"Download .txt"** para exportar a tu EMR

---

## 📞 REPORTAR PROBLEMAS

### **Widget de Feedback (Siempre Visible)**
- **Botón flotante** en esquina inferior derecha con icono de chat
- **Click** para abrir el modal de feedback
- Selecciona:
  - **Tipo:** Bug / Sugerencia / Pregunta
  - **Severidad:** Crítica / Alta / Media / Baja
  - **Descripción:** Describe el problema detalladamente

**IMPORTANTE:**
- Reporta problemas **inmediatamente** cuando ocurran
- Los problemas críticos se notifican al equipo técnico automáticamente
- Incluye pasos para reproducir si es un bug

---

## ✅ FEATURES DISPONIBLES

### **✅ Funcionalidades Implementadas:**
- ✅ Captura de audio en tiempo real
- ✅ Transcripción automática
- ✅ Análisis clínico con Vertex AI
- ✅ Biblioteca de tests MSK (25+ tests)
- ✅ Generación automática de notas SOAP
- ✅ Edición completa de notas SOAP
- ✅ Export a texto plano (copy/download)
- ✅ Guardado automático de sesiones
- ✅ Re-edición de notas finalizadas

### **⚠️ Compliance Features:**
- ✅ Consentimiento para procesamiento AI (PHIPA)
- ✅ Review gate para notas AI-generadas (CPO)
- ✅ Transparency report (supply chain disclosure)

---

## 🐛 PROBLEMAS COMUNES

### **"Error al generar SOAP"**
- **Causa:** Problema de conexión o AI service
- **Solución:** Intenta de nuevo. Si persiste, reporta con feedback widget
- **Fallback:** Puedes crear notas SOAP manualmente

### **"Transcripción no funciona"**
- **Causa:** Permisos de micrófono o conexión
- **Solución:** 
  1. Verifica permisos del navegador
  2. Asegúrate de tener conexión a internet
  3. Intenta refrescar la página

### **"No puedo finalizar SOAP"**
- **Causa:** Review required no completado
- **Solución:**
  1. Click en "Mark as Reviewed"
  2. Marca el checkbox de verificación
  3. Intenta finalizar de nuevo

---

## 📊 QUÉ SE ESTÁ MIDIENDO

Durante el testeo de 1 mes, estamos midiendo:
- ⏱️ **Tiempo de documentación** (inicio → finalización)
- ✅ **Calidad de notas SOAP** (completitud de secciones)
- 🎯 **Adopción de features** (qué features usas más)
- 🐛 **Problemas encontrados** (bugs, errores)
- 💡 **Feedback de mejoras** (sugerencias)

**Todo es anónimo y cumple con PHIPA/PIPEDA.**

---

## ❓ PREGUNTAS FRECUENTES

### **¿Puedo usar datos reales de pacientes?**
- ✅ **SÍ** - El sistema cumple con PHIPA/PIPEDA
- ✅ Todos los datos están encriptados
- ✅ Servidores en Canada (Montreal)

### **¿Qué pasa si encuentro un bug crítico?**
- Reporta inmediatamente usando el widget de feedback
- Marca severidad como **"Crítica"**
- El equipo técnico será notificado automáticamente

### **¿Puedo exportar mis notas?**
- ✅ **SÍ** - Usa "Copy to Clipboard" o "Download .txt"
- ✅ Formato compatible con EMRs
- ✅ Puedes pegar directamente en tu sistema

### **¿Qué hago si algo no funciona?**
1. Revisa esta guía de problemas comunes
2. Usa el widget de feedback para reportar
3. Intenta refrescar la página
4. Si es crítico, contacta al equipo técnico

---

## 🎯 OBJETIVO DEL TESTEO

**Queremos entender:**
- ¿Cómo usas AiDuxCare en tu práctica diaria?
- ¿Qué funciona bien?
- ¿Qué necesita mejorar?
- ¿Qué falta o qué agregarías?

**Tu feedback es crítico** para hacer AiDuxCare mejor para todos los fisioterapeutas.

---

## 📞 CONTACTO

**Para problemas críticos:**
- Email: compliance@aiduxcare.com
- Usa el widget de feedback (botón flotante)

**Para preguntas generales:**
- Revisa esta guía primero
- Usa el widget de feedback con tipo "Pregunta"

---

**¡Gracias por participar en el testeo!** 🙏  
Tu ayuda es invaluable para hacer AiDuxCare mejor.

---

**Última actualización:** Noviembre 16, 2025

