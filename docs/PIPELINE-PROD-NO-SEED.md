# 🚨 PIPELINE PROD - BLINDAJE ANTI-SEED

## 📋 **POLÍTICA NO-NEGOCIABLE**

**En PRODUCCIÓN:**
- ❌ **NO** archivos `SeedPage.tsx`
- ❌ **NO** archivos `seedDemo.ts` 
- ❌ **NO** botones de seed
- ❌ **NO** emuladores
- ❌ **NO** datos de prueba

## 🔒 **GUARDRAILS IMPLEMENTADOS**

### **1. Firebase.ts - Bloqueo de Seguridad**
```typescript
// BLOQUEO DE SEGURIDAD: Si es PROD, emuladores están PROHIBIDOS
if (envTarget === 'PROD' && useEmulators) {
  throw new Error('🚨 SEGURIDAD: Emuladores PROHIBIDOS en PROD');
}
```

### **2. Variables de Entorno**
```bash
VITE_ENV_TARGET=PROD
VITE_USE_EMULATORS=false
VITE_ALLOW_SEED=false
```

### **3. Service Worker**
- Solo se registra en `import.meta.env.PROD`
- En desarrollo: NO interfiere con HMR

## 🚫 **ARCHIVOS PROHIBIDOS EN PROD**

- `src/pages/SeedPage.tsx` ❌
- `src/dev/seedDemo.ts` ❌
- Cualquier archivo con `seed` en el nombre ❌

## ✅ **ARCHIVOS PERMITIDOS EN PROD**

- `src/pages/WelcomePage.tsx` ✅ (solo login)
- `src/lib/firebase.ts` ✅ (solo cloud)
- `src/router/router.tsx` ✅ (sin rutas seed)

## 🔍 **VERIFICACIÓN AUTOMÁTICA**

### **Pre-commit Hook**
```bash
# Verificar que no hay archivos seed
if find src -name "*seed*" -type f; then
  echo "❌ ARCHIVOS SEED DETECTADOS - COMMIT BLOQUEADO"
  exit 1
fi
```

### **CI Pipeline**
```yaml
- name: Anti-Seed Check
  run: |
    if grep -r "SeedPage\|seedDemo" src/; then
      echo "❌ Seed artifacts detected - BUILD FAILED"
      exit 1
    fi
```

## 🚨 **ACCIONES INMEDIATAS SI SE DETECTA SEED**

1. **BLOQUEAR COMMIT** inmediatamente
2. **REVERTIR** a último estado limpio
3. **INVESTIGAR** origen del archivo seed
4. **DOCUMENTAR** incidente de seguridad

## 📞 **CONTACTO DE EMERGENCIA**

- **CTO**: @mauriciosobarzo
- **Implementador**: Claude (implementador jefe)
- **Prioridad**: CRÍTICA - Bloqueo inmediato

---

**Última actualización**: $(date)
**Implementado por**: Claude (implementador jefe)
**Estado**: ✅ ACTIVO Y BLOQUEANDO
