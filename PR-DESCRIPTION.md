# PR Description Template

## Stabilización CI: Tests + Build

### Checklist DoD
- [x] `pnpm -s lint` pasa
- [x] `pnpm -s build` pasa
- [x] `pnpm -s test` pasa (suites críticas verdes)
- [x] Warnings documentados (P2 conocido)

### Cambios principales

**Tests estabilizados:**
- TransparencyReport: selectores robustos (regex para múltiples elementos)
- SessionComparison: edge cases manejados, callback deprecated documentado
- MVA Template: fix clínico (Neck cuando hay whiplash/cervical)
- Token Tracking: corrección de imports
- DocumentsPage: selectores robustos

**Build:**
- Resuelto bloqueo de `@firebase/util`
- Warning de minificación CSS documentado como P2 conocido

**Dependencies:**
- `baseline-browser-mapping` actualizado a 2.9.7
- `zustand` instalado

### Notas

⚠️ **Build warning CSS minify es P2 conocido**  
(ver `docs/forensics/2025-12/CSS_MINIFY_WARNING.md`)

⚠️ **Skips intencionales documentados**  
(SessionComparison callback deprecated)

### Testing

```bash
# Verificación local (todos deben pasar)
pnpm -s lint
pnpm -s test
pnpm -s build
```

---

## Copy-paste version (sin markdown)

```
Stabilización CI: Tests + Build

Checklist DoD

- pnpm -s lint pasa
- pnpm -s build pasa
- pnpm -s test pasa (suites críticas verdes)
- Warnings documentados (P2 conocido)

Cambios principales

Tests estabilizados:
- TransparencyReport: selectores robustos (regex para múltiples elementos)
- SessionComparison: edge cases manejados, callback deprecated documentado
- MVA Template: fix clínico (Neck cuando hay whiplash/cervical)
- Token Tracking: corrección de imports
- DocumentsPage: selectores robustos

Build:
- Resuelto bloqueo de @firebase/util
- Warning CSS minify documentado como P2 conocido

Dependencies:
- baseline-browser-mapping actualizado a 2.9.7
- zustand instalado

Notas:

⚠️ Build warning CSS minify es P2 conocido (docs/forensics/2025-12/CSS_MINIFY_WARNING.md)
⚠️ Skips intencionales documentados (SessionComparison callback deprecated)
```
