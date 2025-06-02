# 📋 Plan de Estabilización MVP - AiDuxCare V.2

## 🎯 **OBJETIVO PRINCIPAL**
Transformar la aplicación actual en un MVP estable para pruebas clínicas, resolviendo problemas críticos y aplicando la identidad visual completa.

---

## 🚨 **FASE 1: RESOLVER BLOQUEADORES CRÍTICOS** *(Máxima Urgencia)*

### **Sub-Tarea 1.1: Estabilizar Conexión y Cliente Supabase** *(Prioridad #1 Absoluta)*

#### **Problemas Identificados:**
- ❌ `Multiple GoTrueClient instances detected` (CRÍTICO)
- ❌ `Failed to load resource: net::ERR_NAME_NOT_RESOLVED mchyxyuaegsbrwodengr.supabase.co` (BLOQUEADOR)
- ❌ Múltiples instancias de cliente Supabase

#### **Acciones Requeridas:**

**1. Verificación de Variables de Entorno:**
```bash
# Verificar archivo .env.local
cat .env.local | grep SUPABASE

# Verificar archivo .env
cat .env | grep SUPABASE
```

**2. Verificación del Estado del Proyecto Supabase:**
- [ ] Acceder al dashboard de Supabase
- [ ] Confirmar que el proyecto `mchyxyuaegsbrwodengr` está ACTIVO
- [ ] Verificar que las credenciales coincidan exactamente

**3. Prueba de Resolución DNS:**
```bash
# Ejecutar desde terminal
ping mchyxyuaegsbrwodengr.supabase.co

# Alternativa con nslookup
nslookup mchyxyuaegsbrwodengr.supabase.co
```

**4. Refactorización de Cliente Supabase (CRÍTICO):**
- [ ] Crear instancia ÚNICA en `src/lib/supabaseClient.ts`
- [ ] Eliminar todas las demás llamadas a `createClient()`
- [ ] Importar la instancia única donde se necesite
- [ ] Verificar que no hay múltiples archivos de configuración de Supabase

#### **Archivos a Revisar:**
```
src/lib/supabase.ts
src/core/config/env.ts
src/config/env.ts
src/core/auth/supabaseClient.ts
src/core/auth/hardcodedClient.ts
src/core/auth/supabaseOverride.ts
```

#### **Criterio de Éxito:**
✅ Sin errores `ERR_NAME_NOT_RESOLVED` en consola  
✅ Sin errores `Multiple GoTrueClient instances`  
✅ Aplicación puede comunicarse con Supabase  

---

### **Sub-Tarea 1.2: Estabilizar Lógica Central del Agente** *(Prioridad #2)*

#### **Problemas Identificados:**
- ❌ `Error al ejecutar el agente clínico`
- ❌ `Error al construir el contexto del agente`

#### **Acciones Requeridas:**

**1. Depuración del Flujo del Agente:**
- [ ] Agregar `console.log` en `src/core/agent/ClinicalAgent.ts`
- [ ] Agregar `console.log` en `src/core/agent/AgentContextBuilder.ts`
- [ ] Agregar `console.log` en `src/core/agent/runClinicalAgent.ts`
- [ ] Rastrear punto exacto del fallo

**2. Validación de Dependencias:**
- [ ] Verificar que datos de Supabase se cargan correctamente
- [ ] Implementar fallbacks con datos mockeados si es necesario
- [ ] Verificar imports y exports de módulos del agente

#### **Archivos a Revisar:**
```
src/core/agent/runClinicalAgent.ts
src/core/agent/AgentContextBuilder.ts
src/core/agent/ClinicalAgent.ts
src/features/demo/DemoVisitPage.tsx (línea donde se llama runClinicalAgent)
```

#### **Criterio de Éxito:**
✅ Sin errores de ejecución del agente en consola  
✅ Sección "Sugerencias del Copiloto" muestra estado coherente  
✅ Sugerencias se populan correctamente (reales o mockeadas)  

---

## 🎨 **FASE 2: INTEGRACIÓN DE IDENTIDAD VISUAL Y FUNCIONALIDAD MVP** *(Alta Prioridad)*

### **Sub-Tarea 2.1: Aplicación de Estilos Globales y Verificación**

#### **Acciones Requeridas:**

**1. Verificación de CSS Global:**
- [ ] Confirmar que `src/index.css` contiene:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] Verificar importación en `src/main.tsx`
- [ ] Reiniciar servidor Vite después de cambios en `tailwind.config.js`

**2. Verificación de Configuración Tailwind:**
```bash
# Verificar que tailwind.config.js existe y está bien configurado
cat tailwind.config.js

# Reiniciar servidor después de cambios
npm run dev
```

#### **Archivos a Revisar:**
```
src/index.css
src/main.tsx
tailwind.config.js
vite.config.ts
```

#### **Criterio de Éxito:**
✅ Color de fondo correcto según identidad visual  
✅ Fuente por defecto aplicada correctamente  
✅ Paleta de colores funcionando  

---

### **Sub-Tarea 2.2: Refactorizar Vistas Clave del MVP**

#### **Vistas Prioritarias:**
1. **Vista `demo-agent`** (`/demo-agent`) - Principal
2. **Dashboard** (`/dashboard`) - Secundaria
3. **Página principal** (`/`) - Terciaria

#### **Acciones Requeridas:**

**1. Identificar Componentes a Reemplazar:**
- [ ] Botones básicos → Componentes Button estilizados
- [ ] Cards planas → Componentes Card con identidad visual
- [ ] Sidebar básica → Sidebar estilizada
- [ ] Tags y highlights → Usar paleta oficial

**2. Aplicar Componentes Base Estilizados:**
- [ ] Reemplazar elementos HTML planos en `src/App.tsx`
- [ ] Reemplazar elementos en `src/features/demo/DemoVisitPage.tsx`
- [ ] Usar definiciones de `tailwind.config.js`
- [ ] Mantener funcionalidad existente

#### **Archivos a Modificar:**
```
src/App.tsx
src/features/demo/DemoVisitPage.tsx
src/shared/components/UI/Button.tsx (si existe)
src/shared/components/UI/Card.tsx (si existe)
```

#### **Criterio de Éxito:**
✅ Vistas clave reflejan identidad visual consistente  
✅ Componentes base estilizados implementados  
✅ Paleta de colores aplicada correctamente  

---

### **Sub-Tarea 2.3: Validación Funcional de Componentes Estabilizados**

#### **Componentes a Validar:**
- [ ] `AgentSuggestionsViewer` - Toggle funcional
- [ ] `AgentSuggestionExplainer` - Explicaciones desplegables
- [ ] `Accordion` - Expandir/colapsar
- [ ] Botones de aceptar/rechazar sugerencias
- [ ] Integración con EMR

#### **Acciones Requeridas:**

**1. Pruebas Manuales en `/demo-agent`:**
- [ ] Probar toggle de sugerencias
- [ ] Probar aceptar/rechazar sugerencias
- [ ] Verificar integración con EMR
- [ ] Probar navegación entre pestañas (Métricas, Auditoría, Contexto MCP)

**2. Verificar Interacciones:**
- [ ] Estados de loading
- [ ] Manejo de errores
- [ ] Feedback visual al usuario
- [ ] Captura de audio funcional

#### **URLs de Prueba:**
```
http://localhost:5173/demo-agent
http://localhost:5173/dashboard
http://localhost:5173/
```

#### **Criterio de Éxito:**
✅ Componentes principales funcionan según lo esperado  
✅ Interacciones fluidas y responsivas  
✅ Estados de UI coherentes  

---

## ✅ **FASE 3: ESTABILIZACIÓN FINAL DE TESTS** *(Después de Fases 1 y 2)*

### **Sub-Tarea 3.1: Ejecutar Suite Completa de Tests**

#### **Acciones Requeridas:**

**1. Ejecución de Tests:**
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests específicos del ecosistema Agent
npm test src/shared/components/Agent/__tests__

# Ejecutar tests con coverage
npm run test:coverage
```

**2. Análisis de Resultados:**
- [ ] Identificar tests fallidos
- [ ] Categorizar fallos (DOM/Tailwind vs lógica)
- [ ] Priorizar correcciones

**3. Corrección de Tests:**
- [ ] Ajustar selectores DOM para nueva estructura
- [ ] Actualizar snapshots si es necesario
- [ ] Verificar mocks y stubs

#### **Criterio de Éxito:**
✅ Número mínimo de tests fallidos  
✅ Fallos restantes son desajustes menores  
✅ Funcionalidad crítica validada por tests  

---

## 📊 **MÉTRICAS DE ÉXITO DEL MVP**

### **Indicadores Técnicos:**
- [ ] 0 errores críticos en consola del navegador
- [ ] Conexión estable a Supabase
- [ ] Tiempo de carga < 3 segundos
- [ ] Componentes responsivos en móvil/desktop

### **Indicadores Funcionales:**
- [ ] Captura de audio funcional
- [ ] Sugerencias del copiloto operativas
- [ ] Integración EMR funcionando
- [ ] Navegación fluida entre secciones

### **Indicadores Visuales:**
- [ ] Identidad visual consistente
- [ ] Paleta de colores aplicada
- [ ] Tipografía coherente
- [ ] Componentes alineados con diseño

---

## 🚀 **PROTOCOLO DE EJECUCIÓN**

### **Orden de Ejecución ESTRICTO:**
1. **FASE 1** → Resolver bloqueadores críticos
2. **FASE 2** → Aplicar identidad visual y funcionalidad
3. **FASE 3** → Estabilizar tests

### **Puntos de Control:**
- ✋ **STOP**: No avanzar a siguiente fase sin completar criterios de éxito
- 📋 **CHECKPOINT**: Documentar progreso después de cada sub-tarea
- 🔄 **ITERACIÓN**: Repetir sub-tarea si criterios no se cumplen

### **Comunicación:**
- 📢 **Reporte inmediato** después de cada sub-tarea completada
- 🚨 **Escalación inmediata** si se encuentran bloqueadores nuevos
- ✅ **Confirmación explícita** antes de avanzar a siguiente fase

---

## 🛠️ **COMANDOS ÚTILES DE REFERENCIA**

### **Desarrollo:**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Limpiar cache de Vite
rm -rf node_modules/.vite

# Reinstalar dependencias
npm install

# Verificar variables de entorno
cat .env.local
cat .env
```

### **Testing:**
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
npm test src/shared/components/Agent

# Ejecutar tests con watch mode
npm test -- --watch

# Ejecutar tests con coverage
npm run test:coverage
```

### **Debugging:**
```bash
# Verificar conectividad a Supabase
ping mchyxyuaegsbrwodengr.supabase.co

# Verificar puertos en uso
lsof -i :5173

# Ver logs del servidor
npm run dev -- --debug
```

---

## 📝 **LOG DE PROGRESO**

### **Fecha: [FECHA]**
- [ ] **FASE 1.1**: Estabilizar Conexión Supabase
- [ ] **FASE 1.2**: Estabilizar Lógica del Agente
- [ ] **FASE 2.1**: Aplicar Estilos Globales
- [ ] **FASE 2.2**: Refactorizar Vistas Clave
- [ ] **FASE 2.3**: Validar Componentes
- [ ] **FASE 3.1**: Estabilizar Tests

### **Notas:**
```
[Espacio para notas de progreso, problemas encontrados, soluciones aplicadas]
```

---

**¡ESTE PLAN SE SEGUIRÁ AL PIE DE LA LETRA PARA GARANTIZAR UN MVP ESTABLE PARA PRUEBAS CLÍNICAS!** 🎯

---

## 📞 **CONTACTOS DE EMERGENCIA**

- **CTO**: [Información de contacto]
- **Lead Developer**: [Información de contacto]
- **DevOps**: [Información de contacto]

---

*Documento creado: [FECHA]*  
*Última actualización: [FECHA]*  
*Versión: 1.0* 