# 🎯 ROADMAP TÉCNICO PARA APROBACIÓN CTO
## AiDuxCare V.2 - Arquitectura de Páginas y Funcionalidades

**Fecha**: 8 de Junio 2025  
**Versión**: 2.0  
**Estado**: Pendiente Aprobación CTO  

---

## 📋 RESUMEN EJECUTIVO

### Objetivo
Crear una plataforma EMR profesional con IA integrada que combine la elegancia de Apple con la calidez de jane.app, aplicando los principios de "Claridad Clínica".

### Arquitectura Visual
- **Paleta Oficial**: #2C3E50 (blue-slate), #A8E6CF (mint-green), #FF6F61 (coral), #5DA5A3 (intersection-green)
- **Tipografía**: -apple-system, BlinkMacSystemFont (Apple style)
- **Espaciado**: Generoso, minimalista, enfocado en funcionalidad

---

## 🏗️ ARQUITECTURA DE PÁGINAS

### 1. **PÁGINA DE BIENVENIDA CORPORATIVA**
**Ruta**: `/`  
**Propósito**: Primera impresión profesional y captación de usuarios

#### Especificaciones Técnicas:
- **Header Profesional**: Logo AIDUX + navegación mínima
- **Hero Section**: Value proposition clara con CTAs principales
- **Value Props**: 3 pilares (Transcripción IA, SOAP Automático, Privacidad)
- **Footer**: Branding consistente y legal

#### Funcionalidades:
- Navegación fluida hacia autenticación
- Responsive design completo
- Carga rápida (<2s)
- Optimización SEO

#### Diseño:
```
[LOGO AIDUX]                    [Acceder] [Comenzar]

           🎯 Revolucionando la Fisioterapia con IA

               EMR Inteligente + Copiloto Clínico IA

    [🎯 Probar Demo Interactivo] [📋 Acceder al Portal Médico]

[Transcripción IA] [SOAP Automático] [Privacidad Total]
```

---

### 2. **PÁGINA DE AUTENTICACIÓN**
**Ruta**: `/auth`  
**Propósito**: Acceso seguro y profesional al sistema

#### Especificaciones Técnicas:
- **Card Central**: Formulario elegante y minimalista
- **Validación**: Tiempo real con feedback visual
- **Seguridad**: Encriptación local y validación robusta

#### Funcionalidades:
- Login con email/contraseña
- Validación en tiempo real
- Estados de carga elegantes
- Manejo de errores UX-friendly

#### Diseño:
```
                    AIDUX CARE
                   EMR + IA Clínica

              ┌─────────────────────┐
              │   Acceso Profesional │
              │                     │
              │ [Email          ] │
              │ [Contraseña     ] │
              │                     │
              │    [Acceder]        │
              └─────────────────────┘
```

---

### 3. **PÁGINA CAPTURA PACIENTE (FASE 0)**
**Ruta**: `/patient-data`  
**Propósito**: Captura inicial de datos del paciente

#### Especificaciones Técnicas:
- **Formulario Estructurado**: Campos esenciales organizados
- **Validación Inteligente**: Progresiva y contextual
- **Persistencia**: LocalStorage para transferencia de datos

#### Campos Obligatorios:
- Nombre Completo *
- Edad *
- Email
- Teléfono
- Motivo de Consulta *

#### Funcionalidades:
- Autoguardado en LocalStorage
- Validación en tiempo real
- Navegación fluida hacia sesión clínica
- Diseño responsive

#### Diseño:
```
              Nuevo Paciente
        Información básica para iniciar la atención

    ┌─────────────────────────────────────────┐
    │ Datos del Paciente                      │
    │                                         │
    │ [Nombre Completo *    ] [Edad *    ]   │
    │ [Email               ] [Teléfono   ]   │
    │ [Motivo de Consulta *             ]   │
    │                                         │
    │        [Cancelar]    [Iniciar Atención] │
    └─────────────────────────────────────────┘
```

---

### 4. **PÁGINA SESIÓN CLÍNICA (FASE 1)**
**Ruta**: `/patient-complete`  
**Propósito**: Workflow principal de atención clínica

#### Especificaciones Técnicas:
- **3 Modos**: Review → Active → Completed
- **Web Speech API**: Transcripción en tiempo real
- **IA Básica**: Detección automática de highlights clínicos
- **Editor SOAP**: Funcionalidad manual editable

#### Estados del Sistema:
1. **Review**: Muestra datos del paciente cargados
2. **Active**: Grabación + transcripción + highlights
3. **Completed**: SOAP generado + opciones de export

#### Funcionalidades Core:
- **Botón "Grabar con IA"**: Activa Web Speech API
- **Botón "Documentar Manual"**: Template SOAP editable
- **Highlights Automáticos**: Categorización (síntoma, hallazgo, plan)
- **Generación SOAP**: Automática basada en highlights

#### Diseño Layout:
```
[Info Paciente: Juan Pérez (35 años)]

Modo: Review
[🎙️ Grabar con IA] [✍️ Documentar Manual]

Modo: Active
┌─────────────────┐ ┌─────────────────┐
│🎙️ Transcripción │ │✨ Highlights    │
│                 │ │                 │
│ [Audio en vivo] │ │ ☑️ Dolor lumbar │
│                 │ │ ☐ Ejercicios   │
│ 🔴 [STOP]       │ │                 │
└─────────────────┘ └─────────────────┘

Modo: Completed
┌─────────────────────────────────────────┐
│📋 Documentación SOAP                   │
│                                         │
│ SUBJETIVO: Dolor lumbar...              │
│ OBJETIVO: Evaluación física...          │
│ EVALUACIÓN: Diagnóstico...              │
│ PLAN: Tratamiento...                    │
│                                         │
│ [💾 Guardar] [📄 PDF] [🏠 Inicio]      │
└─────────────────────────────────────────┘
```

---

### 5. **PÁGINA DOCUMENTACIÓN FINAL (FASE 2)**
**Integrada en `/patient-complete` modo 'completed'**  
**Propósito**: Export y almacenamiento seguro

#### Especificaciones Técnicas:
- **Editor SOAP**: Completamente editable
- **Export PDF**: Generación local
- **Almacenamiento**: LocalStorage seguro
- **Resumen Sesión**: Métricas y estadísticas

#### Funcionalidades:
- Edición manual completa del SOAP
- Export a PDF con firma digital
- Almacenamiento local encriptado
- Métricas de sesión (duración, highlights, etc.)

---

## 🎨 PRINCIPIOS DE DISEÑO "CLARIDAD CLÍNICA"

### Paleta de Colores Oficial:
- **#2C3E50** (blue-slate): Textos principales, elementos estructurales
- **#A8E6CF** (mint-green): Éxito, confirmaciones, elementos positivos
- **#FF6F61** (coral): Alertas críticas, acciones destructivas
- **#5DA5A3** (intersection-green): CTAs principales, tecnología IA

### Tipografía:
- **Primaria**: -apple-system, BlinkMacSystemFont
- **Secundaria**: SF Mono (para código/datos)
- **Pesos**: Light (300), Regular (400), Medium (500), Semibold (600)

### Espaciado:
- **Generoso**: Uso abundante de whitespace
- **Consistente**: Grid de 8px como base
- **Funcional**: Cada elemento tiene propósito claro

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### Stack Tecnológico:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Routing**: React Router v6
- **Estado**: React Context + Hooks
- **Almacenamiento**: LocalStorage Service
- **IA/Speech**: Web Speech API + Ollama (futuro)

### Compatibilidad:
- **Navegadores**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Dispositivos**: Desktop primario, tablet secundario
- **Resoluciones**: 1280x720 mínimo, 1920x1080 óptimo

### Performance:
- **Carga inicial**: <3 segundos
- **Interacciones**: <200ms respuesta
- **Transcripción**: Tiempo real (<500ms latencia)

---

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN

### FASE ACTUAL (COMPLETADA):
- ✅ Arquitectura de páginas definida
- ✅ Flujo de datos implementado
- ✅ Web Speech API integrada
- ✅ Botones core funcionando

### SIGUIENTE FASE (1-2 semanas):
- 🔄 Aplicación completa de paleta oficial
- 🔄 Refinamiento UX/UI según principios Apple
- 🔄 Testing exhaustivo de flujo completo
- 🔄 Optimización de performance

### FASE FUTURA (2-4 semanas):
- 🔮 Integración Ollama para IA avanzada
- 🔮 Export PDF profesional
- 🔮 Almacenamiento encriptado
- 🔮 Analytics y métricas

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionalidad:
- [ ] Flujo completo paciente funciona sin errores
- [ ] Web Speech API transcribe correctamente
- [ ] SOAP se genera automática y manualmente
- [ ] Datos persisten entre páginas

### Diseño:
- [ ] Paleta oficial aplicada en 100% del sistema
- [ ] Tipografía Apple consistente
- [ ] Espaciado y layout profesional
- [ ] Responsive design completo

### Performance:
- [ ] Carga < 3 segundos
- [ ] Interacciones < 200ms
- [ ] Sin errores de consola
- [ ] Compatible multi-navegador

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo: Incompatibilidad Web Speech API
**Mitigación**: Fallback a input manual + mensaje informativo

### Riesgo: Performance en dispositivos móviles
**Mitigación**: Optimización progresiva + testing extensivo

### Riesgo: UX no alineado con estándares médicos
**Mitigación**: Testing con profesionales reales + iteración

---

**Estado**: ⏳ **PENDIENTE APROBACIÓN CTO**  
**Próximo Paso**: Implementación inmediata tras aprobación  
**Contacto**: Desarrollo directo con feedback en tiempo real 