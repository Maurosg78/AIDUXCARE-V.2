# 📦 Archivo de Componentes de Autenticación Deprecados

Este directorio contiene componentes de autenticación que han sido deprecados y reemplazados por versiones canónicas.

## 📋 Archivos Archivados

### LoginPage.deprecated.tsx
- **Fecha de deprecación:** 2025-11-15
- **Razón:** Versión incorrecta con texto en español, sin integración completa de servicios
- **Reemplazo:** `src/pages/LoginPage.tsx` (canónico)
- **Problemas identificados:**
  - Texto en español en lugar de inglés (en-CA)
  - No usa estilos canónicos (`wizard.module.css`)
  - Falta integración con `emailActivationService`
  - Flujo de autenticación incompleto

## ✅ Archivos Canónicos Actuales

- `src/pages/LoginPage.tsx` - LoginPage canónico (en-CA, estilos correctos, servicios integrados)
- `src/features/auth/RegisterPage.tsx` - RegisterPage canónico
- `src/router/router.tsx` - Router canónico que usa LoginPage correcto

## 🔍 Verificación

Para verificar que no hay referencias a archivos deprecados:
```bash
grep -r "features/auth/LoginPage" src/
grep -r "@/features/auth/LoginPage" src/
```

Si no hay resultados, el archivo deprecado no está en uso.

