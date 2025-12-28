# Plan de Limpieza - WO-AUTH-GUARD-ONB-DATA-01

## Estado Actual

- **Rama:** `wo/canonical-gate-01` (sin commits aún)
- **Archivos modificados:** ~30 archivos
- **Archivos nuevos:** Muchos (parece que se agregaron al staging)

## Cambios Legítimos (MANTENER)

### 1. WO-AUTH-GUARD-ONB-DATA-01 (Implementación reciente)
- ✅ `src/components/AuthGuard.tsx` - Soft-fail implementado
- ✅ `src/context/ProfessionalProfileContext.tsx` - Retry function agregada
- ✅ `src/pages/ProfessionalOnboardingPage.tsx` - Data use consent UI
- ✅ `src/core/ai/PromptFactory-Canada.ts` - Guardrails de consentimiento
- ✅ `src/pages/EmailVerifiedPage.tsx` - Traducción a en-CA
- ✅ `src/services/vertex-ai-service-firebase.ts` - Guardrails de contexto paciente

### 2. Mejoras de URL Helpers
- ✅ `src/utils/urlHelpers.ts` - Validación mejorada de URLs (legítimo)

### 3. Configuración
- ✅ `package.json` - Dependencias actualizadas
- ✅ `vitest.config.ts` - Configuración de tests
- ✅ `tsconfig.json` - Configuración TypeScript

## Archivos a Revisar (POSIBLES CAMBIOS INNECESARIOS)

### Certificados (probablemente no deberían estar en git)
- `certs/*.pem` - Certificados locales (deberían estar en .gitignore)

### Archivos de Configuración
- `.env.local.example` - Revisar si los cambios son necesarios
- `.env.test` - Revisar cambios
- `config/env/.env.local.template` - Revisar cambios
- `config/env/.env.local.uat` - Revisar cambios

### Archivos de Test
- `src/components/navigation/__tests__/ProtectedRoute.test.tsx` - Cambios del WO (legítimos)
- `src/core/assistant/__tests__/assistantAdapter.spec.ts` - Cambios del WO (legítimos)
- `src/core/audio-pipeline/__tests__/retryWrapper.test.ts` - Cambios del WO (legítimos)

## Acciones Recomendadas

### 1. Limpiar Certificados
```bash
# Agregar certs/ al .gitignore si no está
echo "certs/*.pem" >> .gitignore
echo "certs/*.key" >> .gitignore
echo "certs/*.crt" >> .gitignore

# Remover del staging si están staged
git restore --staged certs/
```

### 2. Revisar Cambios en Archivos de Configuración
- Verificar que los cambios en `.env.*` son intencionales
- Si son cambios de desarrollo local, no deberían estar en el commit

### 3. Organizar Commits
- Separar cambios del WO-AUTH-GUARD-ONB-DATA-01 en un commit
- Separar mejoras de URL helpers en otro commit
- Separar cambios de configuración si son necesarios

## Nota sobre "window"

El usuario menciona que trató de arreglar algo desde window y fracasó. Revisar:
- `src/lib/firebase.ts` - Tiene referencias a `window` pero son necesarias (localStorage, indexedDB)
- No se encontraron cambios problemáticos relacionados con `window` en los archivos modificados

## Próximos Pasos

1. Revisar cambios en archivos de configuración (.env.*)
2. Limpiar certificados del staging
3. Organizar commits por funcionalidad
4. Verificar que no hay cambios innecesarios en archivos críticos

