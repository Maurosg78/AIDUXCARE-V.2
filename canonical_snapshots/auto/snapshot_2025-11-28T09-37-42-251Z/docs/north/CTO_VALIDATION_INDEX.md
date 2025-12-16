# 📋 **ÍNDICE MAESTRO – KIT DE VALIDACIÓN CTO**

**Sprint:** Sprint 1  
**Fecha creación:** _______________  
**Estado:** ⬜ Pendiente / ⬜ En progreso / ⬜ Completado

---

## **🚀 INICIO RÁPIDO**

### **¿Primera vez validando?**
1. Lee: `CTO_VALIDATION_QUICK_START.md` (5 min)
2. Ejecuta: `./scripts/validate-pre-flight.sh`
3. Sigue: `CTO_VALIDATION_CHECKLIST.md`

### **¿Ya validaste antes?**
1. Ejecuta: `./scripts/validate-pre-flight.sh`
2. Usa: `CTO_VALIDATION_QUICK_START.md` (checklist rápido)

---

## **📚 DOCUMENTOS DEL KIT**

### **1. Guías de Validación**

| Documento | Propósito | Tiempo |
|-----------|-----------|--------|
| `CTO_VALIDATION_QUICK_START.md` | Guía rápida (10-15 min) | ⚡ Rápido |
| `CTO_VALIDATION_CHECKLIST.md` | Checklist detallado completo | 📋 Completo |

### **2. Documentación**

| Documento | Propósito |
|-----------|-----------|
| `CTO_VALIDATION_REPORT_TEMPLATE.md` | Template para reporte completo |
| `CTO_POST_VALIDATION_ACTIONS.md` | Qué hacer después de validar |
| `CTO_DEBUGGING_COMMANDS.md` | Comandos de debugging si algo falla |

### **3. Scripts**

| Script | Propósito | Comando |
|--------|-----------|---------|
| `validate-pre-flight.sh` | Verificar ambiente antes de validar | `./scripts/validate-pre-flight.sh` |

---

## **📋 CHECKLIST DE VALIDACIÓN (6 TESTS)**

### **Tests Críticos:**
1. ⬜ **MSK Tests** – Verificación clínica
2. ⬜ **Clinical Vault** – Guardado y aparición

### **Tests Importantes:**
3. ⬜ **Consentimiento** – Flujo móvil
4. ⬜ **Command Center** – English only
5. ⬜ **Copy vs Download** – Consistencia
6. ⬜ **Overlays/Botones** – Paleta oficial

**Total:** ___/6 pasan

---

## **🎯 DECISIONES POST-VALIDACIÓN**

### **🟩 Si todos pasan (6/6):**
- ✅ Sprint 1 VALIDADO
- ✅ Liberar Sprint 2
- 📝 Usar: `CTO_POST_VALIDATION_ACTIONS.md` → Generar Sprint 2 order

### **🟥 Si alguno falla:**
- ❌ Sprint 1 REQUIERE HOTFIX
- ❌ NO liberar Sprint 2
- 📝 Usar: `CTO_POST_VALIDATION_ACTIONS.md` → Generar HOTFIX order
- 🔧 Usar: `CTO_DEBUGGING_COMMANDS.md` → Debugging

---

## **📱 FLUJO COMPLETO**

```
┌─────────────────────────────────────┐
│ 1. PRE-VALIDACIÓN                   │
│    → validate-pre-flight.sh         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. VALIDACIÓN                       │
│    → CTO_VALIDATION_QUICK_START.md  │
│    → CTO_VALIDATION_CHECKLIST.md    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. DOCUMENTACIÓN                    │
│    → CTO_VALIDATION_REPORT_TEMPLATE │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. DECISIÓN                         │
│    → ¿Todos pasan?                  │
│      → Sprint 2 order               │
│    → ¿Alguno falla?                 │
│      → HOTFIX order                 │
└─────────────────────────────────────┘
```

---

## **🔧 HERRAMIENTAS DE DEBUGGING**

### **Si algo falla:**
1. Verificar logs del servidor
2. Verificar consola del navegador (Safari Web Inspector)
3. Verificar Firestore (si aplica)
4. Usar: `CTO_DEBUGGING_COMMANDS.md`

### **Comandos útiles:**
```bash
# Verificar servidor
lsof -i :5174

# Verificar IP
ifconfig | grep "inet "

# Verificar .env
cat .env | grep VITE_DEV_PUBLIC_URL

# Ver logs en tiempo real
npm run dev 2>&1 | tee validation.log
```

---

## **📊 MÉTRICAS**

### **Registrar:**
- Tiempo total: ___ minutos
- Tests que pasan: ___/6
- Tests que fallan: ___/6
- Dispositivo: iPhone [Modelo]
- iOS: ___
- Safari: ___

---

## **📝 NOTAS**

```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

## **🔗 ENLACES RÁPIDOS**

- [Quick Start](CTO_VALIDATION_QUICK_START.md)
- [Checklist Detallado](CTO_VALIDATION_CHECKLIST.md)
- [Reporte Template](CTO_VALIDATION_REPORT_TEMPLATE.md)
- [Post-Validación](CTO_POST_VALIDATION_ACTIONS.md)
- [Debugging](CTO_DEBUGGING_COMMANDS.md)

---

**Última actualización:** _______________

