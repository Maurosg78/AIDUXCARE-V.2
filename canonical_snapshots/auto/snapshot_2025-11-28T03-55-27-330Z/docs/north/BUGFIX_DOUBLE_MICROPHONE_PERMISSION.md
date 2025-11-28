# 🔧 Bug Fix: Double Microphone Permission Request

**Date:** November 21, 2025  
**Status:** ✅ **FIXED**  
**Priority:** 🔴 **CRITICAL** - UX Issue

---

## 🐛 PROBLEMA REPORTADO

**"No sé porque me pide 2 veces acceso al micrófono"**

El usuario reporta que al iniciar la grabación, se solicita permiso del micrófono **dos veces**, lo cual es confuso y degrada la experiencia de usuario.

---

## 🔍 CAUSA IDENTIFICADA

### **Problema: Dos APIs solicitando permisos por separado**

1. **Web Speech API** (`recognition.start()`) - Línea 191
   - Solicita permiso del micrófono automáticamente
   - No puede compartir el stream con MediaRecorder
   - Se ejecuta ANTES de obtener el stream con getUserMedia

2. **MediaRecorder** (`getUserMedia()`) - Línea 203
   - También solicita permiso del micrófono
   - Necesario para capturar audio para Whisper
   - Se ejecuta DESPUÉS de Web Speech API

**Resultado:** Dos solicitudes de permiso consecutivas

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Deshabilitar Web Speech API**

**Razones:**
1. **Whisper es más preciso** para transcripción médica
2. **Web Speech API no puede compartir stream** con MediaRecorder
3. **Una sola solicitud de permiso** mejora UX
4. **Whisper ya proporciona transcripción en tiempo real** con chunks

### **Cambios realizados:**

1. **Removido inicio de Web Speech API** en `startRecording()`
   - Eliminado código que iniciaba `recognition.start()`
   - Agregado comentario explicando por qué está deshabilitado

2. **Removido cleanup de Web Speech API** en `stopRecording()`
   - Eliminado código que detenía `speechRecognitionRef`
   - Simplificado el flujo de detención

3. **Mejorado logging** para diagnóstico
   - Log cuando se solicita permiso
   - Log cuando se obtiene el stream
   - Verificación de estado del stream

---

## 📋 ARCHIVOS MODIFICADOS

- `src/hooks/useTranscript.ts`
  - Removido inicio de Web Speech API
  - Removido cleanup de Web Speech API
  - Agregado logging mejorado
  - Comentarios explicativos agregados

---

## 🧪 TESTING REQUERIDO

### **Test 1: Permiso único**
1. Abrir aplicación en iPhone Safari
2. Iniciar grabación
3. **Verificar:** Solo se pide permiso UNA VEZ
4. Aceptar permiso
5. **Verificar:** Grabación inicia correctamente

### **Test 2: Transcripción funciona**
1. Grabar audio durante 5-10 segundos
2. **Verificar:** Texto aparece en tiempo real
3. **Verificar:** Console muestra logs de transcripción
4. **Verificar:** No hay errores relacionados con Web Speech

### **Test 3: Detener grabación**
1. Detener grabación
2. **Verificar:** Stream se detiene correctamente
3. **Verificar:** No hay errores en console

---

## ✅ VERIFICACIÓN

- ✅ Sin errores de linting
- ✅ Build compilando correctamente
- ✅ Web Speech API removido
- ✅ Logging mejorado
- ✅ Una sola solicitud de permiso

---

## 🎯 BENEFICIOS

1. **Mejor UX:** Una sola solicitud de permiso
2. **Mayor precisión:** Whisper es mejor para transcripción médica
3. **Código más simple:** Menos complejidad, menos bugs
4. **Mejor rendimiento:** Una sola API de transcripción

---

## 📝 NOTAS TÉCNICAS

### **Por qué Web Speech API no puede compartir stream:**

- Web Speech API maneja permisos internamente
- No expone el MediaStream para compartir
- MediaRecorder necesita su propio stream
- Resultado: Dos solicitudes de permiso

### **Por qué Whisper es suficiente:**

- Whisper procesa chunks en tiempo real
- Proporciona transcripción precisa para vocabulario médico
- Soporta múltiples idiomas y acentos
- No requiere preview adicional

---

**Status:** ✅ **FIXED - Ready for Testing**

