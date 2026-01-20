 # INFORME: Campo de Firma en Portal de Consentimiento

**Fecha:** 2026-01-20  
**Problema:** Campo de firma no aparece cuando "Ongoing Consent" está seleccionado por defecto  
**Estado:** ❌ NO RESUELTO

---

## 📋 RESUMEN EJECUTIVO

El campo de firma digital para "Ongoing Consent" no aparece visible cuando el usuario accede al portal de consentimiento, a pesar de que "ongoing" está seleccionado por defecto. Se han realizado múltiples intentos de corrección sin éxito.

---

## 🔍 INTENTOS REALIZADOS

### INTENTO 1: Inicialización de estado basada en `selectedScope`
**Archivo:** `src/components/consent/ConsentActionButtons.tsx`  
**Cambio:**
```typescript
const [showSignatureField, setShowSignatureField] = useState(selectedScope === 'ongoing');
```
**Resultado:** ❌ FALLIDO  
**Razón:** El estado se inicializa correctamente, pero el renderizado condicional `{showSignatureField && ...}` no muestra el campo.

**Commit:** `0a5ef69` (fix(firestore): enterprise-grade rules...)

---

### INTENTO 2: Agregar `useEffect` para sincronizar estado
**Archivo:** `src/components/consent/ConsentActionButtons.tsx`  
**Cambio:**
```typescript
useEffect(() => {
  setShowSignatureField(selectedScope === 'ongoing');
}, [selectedScope]);
```
**Resultado:** ❌ FALLIDO  
**Razón:** El `useEffect` se ejecuta después del primer render, causando un delay. El campo no aparece inmediatamente.

**Commit:** `375efdb` (fix(consent): signature field visible immediately...)

---

### INTENTO 3: Eliminar estado derivado, usar `selectedScope` directamente
**Archivo:** `src/components/consent/ConsentActionButtons.tsx`  
**Cambio:**
```typescript
const showSignatureField = selectedScope === 'ongoing';
// Renderizado: {showSignatureField && ...}
```
**Resultado:** ❌ FALLIDO  
**Razón:** Aunque la lógica es correcta, el renderizado condicional sigue fallando.

**Commit:** `ebdb69c` (fix(consent): ensure signature field renders immediately...)

---

### INTENTO 4: Mover campo dentro del contenedor de "ongoing"
**Archivo:** `src/components/consent/ConsentActionButtons.tsx`  
**Cambio:** Mover el campo de firma dentro del `<div>` que contiene la opción "ongoing"  
**Resultado:** ❌ FALLIDO  
**Razón:** El campo sigue usando renderizado condicional `{selectedScope === 'ongoing' && ...}`, que no funciona.

**Commit:** `c7713b0` (fix(consent): move signature field inside ongoing option...)

---

### INTENTO 5: Cambiar a CSS `display` en lugar de renderizado condicional
**Archivo:** `src/components/consent/ConsentActionButtons.tsx`  
**Cambio:**
```typescript
<div className={`... ${selectedScope === 'ongoing' ? 'block' : 'hidden'}`}>
```
**Resultado:** ❌ FALLIDO (según usuario)  
**Razón:** Aunque el elemento debería estar en el DOM, el usuario reporta que sigue sin aparecer.

**Commit:** `3058171` (fix(consent): use CSS display instead of conditional rendering...)

---

## 🧠 ANÁLISIS DE CAUSAS RAÍZ

### 1. Problema de Renderizado Condicional en React
**Hipótesis:** React puede no estar renderizando el componente correctamente cuando `selectedScope` se inicializa como `'ongoing'` en el estado inicial.

**Evidencia:**
- `selectedScope` se inicializa como `'ongoing'` en `PatientConsentPortalPage.tsx:26`
- El componente `ConsentActionButtons` recibe `selectedScope='ongoing'` como prop
- La condición `selectedScope === 'ongoing'` debería ser `true` desde el inicio

**Posible causa:** Timing de renderizado - el componente puede renderizarse antes de que `selectedScope` esté disponible.

---

### 2. Problema de CSS o Z-Index
**Hipótesis:** El campo puede estar renderizándose pero oculto por CSS o problemas de z-index.

**Evidencia:**
- El componente está dentro de un `<div className="fixed bottom-0...">` con `z-50`
- El campo está dentro de un contenedor con `border-t border-gray-200`
- Puede haber conflictos de CSS que oculten el campo

**Verificación necesaria:** Inspeccionar el DOM en DevTools para ver si el elemento existe pero está oculto.

---

### 3. Problema de Estado Asíncrono
**Hipótesis:** `selectedScope` puede no estar sincronizado correctamente entre el componente padre y el hijo.

**Evidencia:**
- `PatientConsentPortalPage` inicializa `selectedScope` como `'ongoing'`
- `ConsentActionButtons` recibe `selectedScope` como prop
- Puede haber un delay en la propagación del estado

**Verificación necesaria:** Agregar logging para verificar el valor de `selectedScope` en cada render.

---

### 4. Problema de Caché del Navegador
**Hipótesis:** El navegador puede estar sirviendo una versión antigua del componente.

**Evidencia:**
- Múltiples cambios sin efecto visible
- El usuario puede tener caché persistente

**Solución sugerida:** Hard refresh (`Cmd+Shift+R`) o limpiar caché.

---

## 🔧 SOLUCIONES PROPUESTAS (NO IMPLEMENTADAS)

### SOLUCIÓN A: Forzar renderizado inicial con `useLayoutEffect`
```typescript
useLayoutEffect(() => {
  // Forzar re-render si selectedScope es 'ongoing'
  if (selectedScope === 'ongoing') {
    setSignature('');
  }
}, [selectedScope]);
```
**Ventaja:** Se ejecuta síncronamente antes del paint  
**Desventaja:** Puede causar flickering

---

### SOLUCIÓN B: Renderizar campo siempre, deshabilitarlo cuando no es "ongoing"
```typescript
<input
  type="text"
  value={signature}
  onChange={(e) => setSignature(e.target.value)}
  disabled={selectedScope !== 'ongoing'}
  className={selectedScope === 'ongoing' ? '...' : 'opacity-50 cursor-not-allowed'}
/>
```
**Ventaja:** El campo siempre está en el DOM  
**Desventaja:** UX menos clara

---

### SOLUCIÓN C: Usar `key` prop para forzar re-render
```typescript
{selectedScope === 'ongoing' && (
  <div key="signature-field-ongoing">
    <input ... />
  </div>
)}
```
**Ventaja:** Fuerza re-render cuando cambia la key  
**Desventaja:** Puede causar pérdida de foco

---

### SOLUCIÓN D: Mover lógica a componente separado
Crear un componente `SignatureField` que siempre se renderice pero controle su visibilidad internamente.

**Ventaja:** Aísla la lógica de renderizado  
**Desventaja:** Más complejidad

---

## 🐛 PROBLEMA ADICIONAL: Redireccionamiento Flash

**Problema:** Durante menos de un segundo, la aplicación pasa por `professional-onboarding` y luego redirige a `command-center`.

**Logs relevantes:**
```
[INFO] [LOGIN] Profile incomplete (WO-13 criteria), redirecting to professional-onboarding
[INFO] [PROFESSIONAL_ONBOARDING] User already has complete profile (WO-13 criteria), redirecting to command-center
```

**Causa:** La lógica de verificación de perfil está en dos lugares:
1. `LoginPage.tsx` o `AuthContext.tsx` - verifica si el perfil está completo
2. `ProfessionalOnboardingPage.tsx` - verifica nuevamente y redirige

**Solución sugerida:** Eliminar la verificación duplicada o agregar un flag para evitar el renderizado de `ProfessionalOnboardingPage` si el perfil ya está completo.

---

## 📊 ESTADO ACTUAL DEL CÓDIGO

### Archivo: `src/components/consent/ConsentActionButtons.tsx`
- Línea 79: Renderizado condicional `{selectedScope === 'ongoing' && ...}`
- Línea 26: `selectedScope` se recibe como prop
- El campo está dentro del contenedor de "ongoing" option

### Archivo: `src/pages/PatientConsentPortalPage.tsx`
- Línea 26: `const [selectedScope, setSelectedScope] = useState<ConsentScope>('ongoing');`
- Línea 210: `selectedScope={selectedScope}` se pasa a `ConsentActionButtons`

---

## ✅ RECOMENDACIONES

1. **Verificación inmediata:** Inspeccionar el DOM en DevTools para confirmar si el elemento existe pero está oculto
2. **Logging adicional:** Agregar `console.log` en el render de `ConsentActionButtons` para verificar el valor de `selectedScope`
3. **Solución temporal:** Renderizar el campo siempre pero deshabilitarlo cuando no es "ongoing"
4. **Solución definitiva:** Refactorizar para usar un componente separado que controle su propia visibilidad

---

## 🔍 PRÓXIMOS PASOS

1. Agregar logging extensivo para diagnosticar el problema
2. Verificar en DevTools si el elemento existe en el DOM
3. Implementar SOLUCIÓN B (campo siempre visible, deshabilitado cuando no es "ongoing")
4. Corregir el problema de redireccionamiento flash en onboarding

---

**Última actualización:** 2026-01-20  
**Último commit:** `3058171` (fix(consent): use CSS display instead of conditional rendering...)
