# 📋 POLÍTICAS DE MANTENIMIENTO DE CÓDIGO - AiDuxCare V.2

## 🎯 **OBJETIVO**
Mantener un codebase limpio, escalable y de alta calidad mediante políticas automatizadas y revisiones sistemáticas.

---

## 🚫 **ARCHIVOS PROHIBIDOS**

### **Patrones de Nomenclatura No Permitidos**
```
❌ *.backup.*        # Usar control de versiones Git
❌ *.old.*           # Eliminar inmediatamente
❌ *.temp.*          # Usar carpeta temp/ temporal
❌ *.test-*.*        # Usar carpeta __tests__/
❌ *-copy.*          # Duplicación innecesaria
❌ *_deprecated.*    # Eliminar directamente
```

### **Extensiones Temporales Prohibidas**
```
❌ .bak             # Backups manuales
❌ .orig            # Archivos de merge
❌ .rej             # Patches rechazados
❌ .tmp             # Temporales
❌ .cache           # Caché manual
```

---

## 📁 **ESTRUCTURA DE DIRECTORIOS OBLIGATORIA**

### **Directorios Core (No Tocar)**
```
✅ src/              # Código fuente principal
✅ public/           # Assets públicos
✅ __tests__/        # Testing suite
✅ scripts/          # Herramientas de desarrollo
✅ docs/             # Documentación esencial únicamente
✅ config/           # Configuraciones del proyecto
```

### **Directorios Prohibidos en Root**
```
❌ temp/            # Usar .gitignore para exclusión
❌ backup/          # Usar Git para control de versiones
❌ old/             # Eliminar inmediatamente
❌ deprecated/      # Eliminar directamente
❌ archive/         # Mantener solo en docs/ si necesario
❌ test-*/          # Usar __tests__/ únicamente
```

---

## 📄 **DOCUMENTACIÓN ESENCIAL ÚNICAMENTE**

### **Archivos de Documentación Permitidos**
```
✅ README.md                    # Descripción del proyecto
✅ docs/ARCHITECTURE.md         # Arquitectura técnica
✅ docs/API_REFERENCE.md        # Referencia de API
✅ docs/DEPLOYMENT.md           # Guía de despliegue
✅ .github/DEVELOPMENT_POLICIES.md # Este archivo
```

### **Documentación Prohibida**
```
❌ INFORME_*.md                 # Informes temporales
❌ PLAN_*.md                    # Planes de desarrollo temporales
❌ RESUMEN_*.md                 # Resúmenes temporales
❌ IMPLEMENTACION_*.md          # Documentación de tareas completadas
❌ MIGRACION_*.md               # Documentación de migraciones específicas
```

---

## 🔄 **PROCESO DE REVISIÓN OBLIGATORIO**

### **Pre-Commit Hooks**
- ✅ Verificación de patrones prohibidos
- ✅ Linting automático
- ✅ Verificación de estructura de archivos
- ✅ Validación de nomenclatura

### **Pull Request Requirements**
1. **Code Review**: Mínimo 1 aprobación
2. **Build Success**: CI/CD debe pasar
3. **File Structure**: Validación automática
4. **Documentation**: Solo si agrega funcionalidad core

---

## 🧹 **LIMPIEZA AUTOMÁTICA**

### **Frecuencia de Auditorías**
- **Semanal**: Verificación de archivos temporales
- **Mensual**: Auditoría completa de estructura
- **Por Release**: Limpieza profunda antes de versiones

### **Scripts Automatizados**
```bash
npm run cleanup:weekly     # Limpieza semanal
npm run audit:files        # Auditoría de archivos
npm run validate:structure # Validación de estructura
```

---

## 🚨 **VIOLACIONES Y CONSECUENCIAS**

### **Nivel 1: Advertencia**
- Archivos con patrones prohibidos
- Documentación innecesaria
- Estructura incorrecta

### **Nivel 2: Bloqueo**
- Multiple violaciones en PR
- Archivos peligrosos para el build
- Violación de políticas core

### **Nivel 3: Reversión**
- Commits que rompan el build
- Múltiples archivos prohibidos
- Violación sistemática de políticas

---

## 📈 **MÉTRICAS DE CALIDAD**

### **KPIs de Mantenimiento**
- **File Hygiene Score**: % de archivos conformes
- **Build Performance**: Tiempo de compilación
- **Structure Compliance**: Adherencia a políticas
- **Documentation Ratio**: Documentación esencial vs total

### **Targets Objetivo**
- ✅ **File Hygiene**: >95%
- ✅ **Build Time**: <10s
- ✅ **Structure Compliance**: 100%
- ✅ **Documentation Ratio**: <5% del codebase

---

## 🔧 **HERRAMIENTAS OBLIGATORIAS**

### **Development Tools**
- **ESLint**: Configuración estricta
- **Prettier**: Formateo automático
- **Husky**: Git hooks
- **Lint-staged**: Pre-commit validación

### **CI/CD Tools**
- **File Pattern Validation**
- **Build Performance Monitoring**
- **Structure Compliance Check**
- **Automated Cleanup Scripts**

---

## 📞 **CONTACTO PARA EXCEPCIONES**

En casos excepcionales que requieran violación temporal de estas políticas:

1. **Crear Issue** explicando la necesidad
2. **Documentar Plan de Remediación**
3. **Establecer Timeline** para corrección
4. **Obtener Aprobación** del equipo técnico

---

*Última actualización: 16 de Junio 2024*  
*Versión: 1.0*  
*Responsable: Equipo Técnico AiDuxCare* 