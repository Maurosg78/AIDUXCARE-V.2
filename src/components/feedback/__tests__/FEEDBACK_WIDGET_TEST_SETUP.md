# FeedbackWidget Integration Test Setup

## ✅ PHIPA/PIPEDA Compliant: Firebase Real (No Mocks)

Estos tests usan **Firebase real** (sin mocks de contextos internos) para cumplir con normas regulatorias.

## 🚀 Uso Recomendado: Firebase Emulator (CLI)

### Opción 1: Ejecutar con Emulador (Recomendado)

```bash
# Terminal 1: Iniciar Firebase Emulator
pnpm emulators:start

# Terminal 2: Ejecutar tests (el emulador se conecta automáticamente)
pnpm vitest src/components/feedback/__tests__/FeedbackWidget.integration.test.tsx --run
```

El emulador usa la configuración de `firebase.json` y se conecta automáticamente.

### Opción 2: Ejecutar con Variables de Entorno

```bash
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 pnpm vitest src/components/feedback/__tests__/FeedbackWidget.integration.test.tsx --run
```

## 📋 Requisitos

- Firebase CLI instalado: `npm i -g firebase-tools`
- Java instalado (requisito del Firebase Emulator)
- Puerto 9099 disponible (Auth Emulator)

## ✅ Tests que Pasan Sin Emulador

Los siguientes tests NO requieren Firebase y pasan correctamente:

- ✅ `test/ai/translationReviewer.spec.ts`
- ✅ `test/validation/localeValidator.spec.ts`

Estos tests validan JSON locales y lógica de traducción, no requieren Firebase Auth.

## ⚠️ Nota Técnica

`FeedbackWidget.integration.test.tsx` requiere `AuthProvider` real, que a su vez requiere Firebase Auth inicializado. Para cumplir con PHIPA/PIPEDA, no usamos mocks de contextos internos.
