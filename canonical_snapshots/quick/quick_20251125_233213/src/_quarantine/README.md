# 🚨 CUARENTENA - Archivos Non-Canónicos

**Propósito:** Archivos que NO deben ser importados ni usados en producción.

---

## ⚠️ REGLA CRÍTICA

**NUNCA importar archivos desde `src/_quarantine/` en código de producción.**

Estos archivos existen solo para:
- Referencia histórica
- Migración gradual
- Backup temporal

---

## 📁 ESTRUCTURA

```
src/_quarantine/
├── README.md (este archivo)
├── non-canonical-routers/
│   └── [archivos router duplicados]
├── non-canonical-pages/
│   └── [archivos páginas duplicadas]
└── non-canonical-services/
    └── [archivos servicios duplicados]
```

---

## 🔍 CUANDO MOVER UN ARCHIVO AQUÍ

### **Criterios para Cuarentena:**
1. ✅ Archivo duplicado de un archivo canónico
2. ✅ Archivo obsoleto que aún se necesita como referencia
3. ✅ Archivo en migración que no debe usarse aún
4. ✅ Archivo con bugs conocidos que se está reescribiendo

### **NO mover aquí:**
- ❌ Archivos que deben eliminarse completamente
- ❌ Archivos de backup (usar `backups/`)
- ❌ Archivos de documentación obsoleta (usar `docs/_archive/`)

---

## 📝 PROCEDIMIENTO AL MOVER AQUÍ

### **1. Crear subdirectorio específico**
```bash
mkdir -p src/_quarantine/[tipo]-[nombre]
```

### **2. Mover archivo**
```bash
mv src/path/to/file.tsx src/_quarantine/[tipo]-[nombre]/
```

### **3. Crear README en subdirectorio**
```markdown
# Archivo: [nombre]

**Fecha de cuarentena:** [fecha]
**Razón:** [explicación breve]
**Reemplazado por:** [archivo canónico]
**Fecha de eliminación planificada:** [si aplica]
```

### **4. Actualizar imports**
```bash
# Buscar todos los imports
grep -r "from.*old-file" src/

# Reemplazar con import canónico
# Actualizar este README principal
```

### **5. Verificar**
```bash
# Verificar que no quedan imports
grep -r "from.*_quarantine" src/

# Debe retornar vacío (solo este README puede mencionarlo)
```

---

## 🗑️ POLÍTICA DE ELIMINACIÓN

Archivos en cuarentena pueden eliminarse después de:

- ✅ **30 días** sin referencias activas
- ✅ **Migración completa** verificada
- ✅ **Archivo canónico** probado en producción
- ✅ **Aprobación CTO** para eliminación

---

## 📋 ARCHIVOS ACTUALES EN CUARENTENA

### **non-canonical-routers/**
- (Vacío por ahora)

---

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

