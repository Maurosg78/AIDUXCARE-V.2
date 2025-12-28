# P1.2 - hospitalPortalService Diagnostic

**Fecha:** 2025-12-23  
**Test:** `src/services/__tests__/hospitalPortalService.test.ts:114-118`

---

## Diagnóstico

### Test que falla:
```typescript
it('should reject passwords without special characters', () => {
  const result = HospitalPortalService.validatePassword('Password123');
  expect(result.valid).toBe(false);
  expect(result.error).toContain('special character');
});
```

### Regla esperada por el test:
- Password `'Password123'` (sin caracteres especiales) **debe ser rechazada**
- Debe retornar `valid: false` con error que contenga `'special character'`

### Regla actual en implementación (`hospitalPortalService.ts:164-166`):
```typescript
if (!/[!@#$%^&*()_+-=[\]{};':"\\|,.<>/?]/.test(password)) {
  return { valid: false, error: 'Password must contain at least one special character' };
}
```
- **SÍ tiene validación de caracteres especiales**
- El regex debería rechazar `'Password123'` (sin special chars)

### Problema identificado:
- Test falla: `expected true to be false`
- `validatePassword('Password123')` retorna `valid: true` cuando debería ser `false`
- **El regex tiene un bug de escape**: `[\]` se interpreta como rango de caracteres (de `[` a `]`), por lo que el `1` en `Password123` hace match

### Fix aplicado:
**B) Implementación corregida** - Regex arreglado usando expresión regular literal:
```typescript
const specialCharRegex = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>/?]/;
if (!specialCharRegex.test(password)) {
  return { valid: false, error: 'Password must contain at least one special character' };
}
```

**Resultado:** `pnpm test:lowmem:file src/services/__tests__/hospitalPortalService.test.ts` → 14 tests passed ✅

