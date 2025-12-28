# CHECKLIST MASTER ACTUALIZADO
**Fecha:** 2025-12-16  
**Estado:** Post-fix SMS Consent URLs

---

## 0) Estado canónico actual

✅ **Crash fixes + analytics dedupe** (commit d528a975)
- TranscriptArea: timer cleanup + safe reading
- De-identification audit: best-effort (no-op si no disponible)
- Analytics: dedupe efectivo (pilot_session_started, workflow_session_started)

✅ **Persistencia onboarding** (commit ff28b939)
- university, experienceYears, workplace ahora se persisten en Firestore
- Disponibles para prompt capability-aware

✅ **Hito Legal MVP: contenido + modal + wiring** (commit 0ea0e248)
- LegalModal reusable creado
- legalContent.tsx centralizado (Terms, Privacy, PHIPA/PIPEDA)
- LegalChecklist integrado en LocationDataStep

✅ **Fix URLs consentimiento paciente en SMS** (commits 51fe0768, 3a71594b)
- Router: `/consent/:token` y `/privacy-policy` agregadas
- ConsentVerificationPage: soporta token param
- urlHelpers: mejor fallback (usa VITE_PUBLIC_BASE_URL si VITE_DEV_PUBLIC_URL no está)
- .env.local: IP local removida (solo queda URL pública)

✅ **MSK Skills selector** (commit 350cc045)
- 15 habilidades/cursos comunes en MSK (CA-aligned)
- Campo "Otro" para habilidades adicionales
- Persistencia en Firestore (mskSkills, mskSkillsOther)

✅ **Dropdowns Professional Title y Specialty** (commit 038c09bf)
- PROFESSIONAL_TITLES dropdown (Physiotherapist, PT Assistant, Chiropractor, RMT, Other)
- PRIMARY_SPECIALTIES dropdown (MSK, Neuro, Cardio, Pelvic, Geriatrics, Paediatrics, General, Other)
- Valores canónicos con códigos

✅ **Auto-fill Location desde Personal Data** (commit 038c09bf)
- Country, Province, City se auto-completan desde PersonalDataStep
- Campos editables

✅ **Solo 2 consentimientos** (commit 5366b7be)
- PHIPA/PIPEDA Acknowledgement
- Privacy Policy
- Mensaje dinámico basado en requiredItems.length

✅ **Formato teléfono para SMS/Email** (commit 038c09bf)
- Limpieza de número (solo dígitos)
- Formato: +[country code][clean number]

✅ **Fix campos undefined en Firestore** (commit 303d1a1f)
- Filtrado de campos undefined antes de setDoc()
- mskSkillsOther, mskSkills, etc. se manejan correctamente

✅ **Fix email en campo City** (commits 22e4bcf3, bab54d3e)
- Validación para rechazar emails en campo de ciudad
- Filtrado de personalData para solo pasar country/province/city

✅ **Mejor manejo de errores email verification** (commit 75086773)
- Detección de links expirados/ya usados
- Mensajes claros para el usuario

---

## 1) Consentimiento paciente por SMS (BLOQUEA)

### ✅ 1.1 Fix aplicado (DONE)

**Causa raíz identificada y corregida:**
- `.env.local` tenía valor duplicado con IP local (`192.168.0.203:5174`)
- `getPublicBaseUrl()` estaba devolviendo localhost/IP local

**Fixes aplicados:**
- Router: `/consent/:token` (pública, sin auth) y `/privacy-policy` agregadas
- `ConsentVerificationPage`: soporta `token` param (preparado para implementación)
- `urlHelpers.ts`: mejor fallback (usa `VITE_PUBLIC_BASE_URL` si `VITE_DEV_PUBLIC_URL` no está)
- `.env.local`: IP local removida (solo queda URL pública)

**Estado técnico:**
- `smsService.ts` ya usa `getPublicBaseUrl()` correctamente (líneas 78-80)
- SMS ahora debe salir con:
  - `https://aiduxcare-mvp-uat.web.app/consent/{token}`
  - `https://aiduxcare-mvp-uat.web.app/privacy-policy`

**Commits:**
- `51fe0768` - fix: consent SMS links use public URL, not localhost IP
- `3a71594b` - fix: ConsentVerificationPage support token param

### 🟥 1.2 Validación real end-to-end (PENDIENTE - CRÍTICO)

**Checklist de validación:**
- [ ] Reiniciar `pnpm dev` (para tomar `.env.local` actualizado)
- [ ] Crear paciente → enviar SMS consentimiento
- [ ] Abrir link desde teléfono real (datos móviles, no Wi-Fi de dev)
- [ ] Verificar que `/consent/:token` carga sin auth
- [ ] Confirmar que el token autoriza/actualiza estado en Firestore
- [ ] Verificar que `/privacy-policy` carga correctamente

**DONE cuando:** El paciente puede completar consentimiento sin depender de red local.

### 🟧 1.3 "Hardening" para que esto no vuelva a pasar (RECOMENDADO)

**Tareas:**
- [ ] Si `VITE_DEV_PUBLIC_URL` contiene `localhost` o `192.168.*` y se intenta enviar SMS → log warning + bloquear envío (modo dev)
- [ ] Doc corto: "Cómo configurar DEV_PUBLIC_URL" (en `docs/north/...`)
- [ ] Validación en `urlHelpers.ts` para rechazar IPs locales en producción

**DONE cuando:** Sistema previene automáticamente el uso de URLs locales en SMS.

---

## 2) Onboarding: calidad y estandarización de datos (BLOQUEA pronto por prompting)

### ✅ 2.1 Dropdowns / standard input (PARCIALMENTE DONE)

**Estado actual:**
- ✅ `professionalTitle` dropdown (Physiotherapist, PT Assistant, Chiropractor, RMT, Other)
- ✅ `specialty` dropdown canónico (MSK, Neuro, Cardio, Pelvic, Geriatrics, Paediatrics, General, Other)
- ✅ `country`/`province` dropdown (ya existía)
- ✅ `city` (texto OK, P1 autocomplete pendiente)
- ✅ `university` (texto OK, P1 autocomplete pendiente)

**🟥 Pendiente:**
- [ ] Guardar códigos canónicos además de label:
  - `specialtyCode` (ej: 'msk', 'neuro')
  - `professionalTitleCode` (ej: 'physio', 'assistant')
  - Mantener `specialtyLabel` como display string para UI

**DONE cuando:** Firestore guarda códigos canónicos + labels, y el prompt puede usar los códigos.

### 🟥 2.2 Entrada al onboarding (UX/flujo) (PENDIENTE)

**Tareas:**
- [ ] Definir entrypoint claro: "Create account / Start onboarding"
- [ ] Hospital flow sin onboarding: decidir si aplica o no, pero que no confunda al usuario

**DONE cuando:** Un usuario nuevo sabe dónde registrarse sin entender "hospital vs private practice".

---

## 3) Consentimientos legales en onboarding (BLOQUEA por confianza)

### ✅ 3.1 Links legales visibles (DONE)

**Estado actual:**
- ✅ `LegalChecklist` componente creado con links inline clickeables
- ✅ `LegalModal` reusable para mostrar contenido legal
- ✅ `LocationDataStep` integra `LegalChecklist`
- ✅ Cada checkbox incluye link que abre `LegalModal`:
  - "I acknowledge **PHIPA / PIPEDA** safeguards..."
  - "I have read the **Privacy Policy** *"

**Verificación necesaria:**
- [ ] Confirmar visualmente que los links son clickeables en la UI
- [ ] Verificar que `LegalModal` se abre correctamente con el contenido apropiado

**DONE cuando:** El usuario puede leer lo que está aceptando antes de marcar.

### 🟧 3.2 Benchmark legal (OPCIONAL)

**Tareas:**
- [ ] Recopilar ejemplos de instituciones/empresas (P1) para iterar el wording
- [ ] Lista de referencias + gaps vs legal MVP actual

**DONE cuando:** Lista de referencias + gaps documentados.

---

## 4) Activación profesional por SMS + permisos (BLOQUEA)

### 🟥 4.1 Estados del profesional (PENDIENTE)

**Tareas:**
- [ ] Contrato de estado en `users/{uid}`: `isActive`, `emailVerified`, `tokenExpiry`, etc.
- [ ] `activate?token=` debe activar de forma idempotente y segura
- [ ] Verificar que no hay loops raros ni activaciones inconsistentes

**DONE cuando:** No hay loops raros ni activaciones inconsistentes.

### 🟥 4.2 Duplicados email/phone (PENDIENTE)

**Estado actual:**
- ✅ Email: normalmente lo bloquea Auth

**Pendiente:**
- [ ] Phone: definir si es único y validar server-side
- [ ] Regla explícita: no se puede reusar phone (o queda regla explícita)

**DONE cuando:** No se puede reusar phone (o queda regla explícita).

---

## 5) Prompt capability-aware (objetivo central, pero depende de #2 y #4)

### 🟥 5.1 El profile está llegando undefined al prompt (PENDIENTE CRÍTICO)

**Tareas:**
- [ ] Confirmar que el usuario con el que entras a workflow tiene datos completos en `users/{uid}`
- [ ] Verificar que `ProfessionalProfileContext` lee el doc correcto
- [ ] Logs de `PromptFactory` deben mostrar `specialty`/`title`/`experienceYears` reales

**DONE cuando:** Logs de PromptFactory muestran specialty/title/experienceYears reales.

### 🟧 5.2 Modularización del prompt (SIGUIENTE WO)

**Estado actual:**
- ✅ `deriveProfessionalCapabilities()` implementado
- ✅ `buildCapabilityContext()` en `PromptFactory-Canada.ts`
- ✅ Integración parcial (solo cuando profile no es default)

**Pendiente:**
- [ ] Contract de capability context (junior/mid/senior + specialty domain + tone)
- [ ] Aplica "prioridad/lenguaje" sin inflar el output
- [ ] Integrar `mskSkills` y `mskSkillsOther` en el prompt

**DONE cuando:** Prompt usa capabilities para ajustar prioridad/lenguaje sin inflar output.

---

## 6) Concisión del Analysis tab (WO de repetición)

### 🟥 6.1 Caps por sección (PENDIENTE)

**Tareas:**
- [ ] Definir límites: max 6-8 bullets por sección
- [ ] Implementar validación en contract validator
- [ ] Aplicar en normalizer

**DONE cuando:** Respuesta más corta, sin loops ni ítems repetidos.

### 🟥 6.2 Deduper en normalizer (PENDIENTE)

**Tareas:**
- [ ] Evitar duplicar hallazgos (clínicos vs relevantes)
- [ ] Implementar deduplicación semántica

**DONE cuando:** No hay duplicación de contenido en Analysis tab.

---

## 🔥 Prioridad recomendada (para no perderse)

### P0 (CRÍTICO - Bloquea funcionalidad core)
1. **1.2** Validar SMS consent en teléfono real ⚠️ **BLOQUEA consentimiento paciente**
2. **5.1** Profile undefined en prompt ⚠️ **BLOQUEA prompt capability-aware**
3. **4.1** Activación/permisos profesional ⚠️ **BLOQUEA acceso profesional**

### P1 (ALTO - Bloquea calidad/UX)
4. **3.1** Links legales visibles (verificar visualmente) ⚠️ **BLOQUEA confianza legal**
5. **2.1** Guardar códigos canónicos (specialtyCode, professionalTitleCode) ⚠️ **BLOQUEA estandarización**

### P2 (MEDIO - Mejora calidad)
6. **1.3** Hardening URLs (prevenir localhost en SMS)
7. **2.2** Entrypoint claro onboarding
8. **6.1** Caps por sección Analysis tab
9. **6.2** Deduper en normalizer

### P3 (BAJO - Nice to have)
10. **3.2** Benchmark legal
11. **4.2** Duplicados phone (si aplica)
12. **5.2** Modularización prompt (siguiente WO)

---

## 📋 Nota dura (pero clave)

**Dos flujos distintos (no mezclar):**

1. **SMS consentimiento paciente** (link público `/consent/:token`)
   - ✅ Ya encaminado (fix URLs aplicado)
   - 🟥 Pendiente: validación end-to-end real

2. **SMS activación profesional** (`activate?token=` + permisos)
   - 🟥 Aún frágil (estados, idempotencia, duplicados)

**Mantener estos dos flujos separados en el backlog.**

---

## 🎯 Próximo WO sugerido

**WO-CONSENT-VALIDATION-01** (P0)
- Objetivo: Validar end-to-end el flujo de consentimiento paciente por SMS
- Scope:
  1. Implementar verificación de token en `/consent/:token`
  2. Validar en teléfono real (no Wi-Fi dev)
  3. Confirmar que actualiza Firestore correctamente
  4. Hardening: prevenir localhost en SMS (1.3)

**WO-PROFILE-UNDEFINED-01** (P0)
- Objetivo: Asegurar que ProfessionalProfile llega completo al prompt
- Scope:
  1. Auditar ProfessionalProfileContext
  2. Verificar lectura de Firestore
  3. Logs de PromptFactory con datos reales
  4. Fix si profile está undefined

---

**Última actualización:** 2025-12-16  
**Commits relevantes:** 51fe0768, 3a71594b, 350cc045, 038c09bf, 303d1a1f
