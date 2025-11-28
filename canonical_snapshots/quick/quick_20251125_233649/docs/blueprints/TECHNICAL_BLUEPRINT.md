# 🔧 BLUEPRINT TÉCNICO — AiDuxCare V.2

## Stack
- React 18 + TypeScript, Vite, Tailwind
- Firebase: Auth, Firestore, Storage
- Entornos: DEV / UAT / PROD (UAT activo)

## Estructura
src/
├─ pages/           # Páginas (Login, Onboarding)
├─ components/      # Reutilizables (wizard/*)
├─ features/        # Dominios (auth, visits, etc.)
├─ services/        # OnboardingService, AuditService
├─ lib/             # firebase.ts, utils
├─ types/           # Tipos TS
├─ _deprecated/     # Código obsoleto (NO TOCAR)
└─ z_trash/         # Basura aislada (NO TOCAR)

## Reglas
- TS estricto; sin `any`
- ESLint: unused-imports, boundaries (no deps invertidas)
- Alias: `@` → `src/`
- Vite HMR local

## Calidad mínima
- `tsc --noEmit`: 0 errores
- `eslint .`: 0 violaciones
- 0 imports desde `_deprecated/` o `z_trash/`
- Tests clave del flujo (≥80% donde aplique)

## Flujo técnico
1) Leer ROADMAP
2) Implementar/ajustar
3) Ejecutar typecheck + lint
4) Checklist compliance
5) PR
