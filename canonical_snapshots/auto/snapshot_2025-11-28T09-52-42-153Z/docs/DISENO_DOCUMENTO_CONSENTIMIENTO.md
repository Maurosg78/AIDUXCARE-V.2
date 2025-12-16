# 📋 Diseño: Documento Legal de Consentimiento para Pacientes

## 🎯 Objetivos del Diseño

1. **Documento legal en español** - Traducción completa y precisa
2. **Formato neutro** - Sin negritas, sin destacados, texto simple y legible
3. **Aceptación sin lectura completa** - Botón siempre visible, no requiere scroll completo
4. **Desistimiento claro** - Opción explícita de declinar
5. **Uso sin IA** - Continuar usando la herramienta sin análisis por IA

---

## 📐 Arquitectura de la Solución

### Flujo Actual vs. Flujo Propuesto

**Flujo Actual:**
```
SMS → Link → PatientConsentPortalPage → Formulario largo → Submit
```

**Flujo Propuesto:**
```
SMS → Link → Documento Legal (español) → 
  ├─ Opción A: Aceptar con IA (botón flotante siempre visible)
  ├─ Opción B: Aceptar solo esta sesión
  └─ Opción C: Declinar IA (continuar sin IA)
```

---

## 🎨 Diseño de Interfaz

### Estructura Visual

```
┌─────────────────────────────────────────────────────────┐
│  [MARCO FIJO - SIEMPRE VISIBLE]                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  DOCUMENTO LEGAL (Scrollable)                     │ │
│  │                                                     │ │
│  │  [Contenido del documento en español]              │ │
│  │  [Texto neutro, sin formato especial]              │ │
│  │  [Scroll vertical para leer completo]              │ │
│  │                                                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │  [BOTONES DE ACCIÓN - SIEMPRE VISIBLES]            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │ Aceptar  │ │ Solo esta │ │ Declinar │          │ │
│  │  │   con   │ │  sesión   │ │    IA    │          │ │
│  │  │   IA    │ │           │ │          │          │ │
│  │  └──────────┘ └──────────┘ └──────────┘          │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Componentes Principales

1. **Marco del Documento** (Contenedor principal)
   - Fondo blanco
   - Borde sutil
   - Scroll vertical independiente
   - Altura máxima: 60vh (60% de la pantalla)
   - Padding interno generoso

2. **Barra de Acciones Fija** (Footer sticky)
   - Siempre visible en la parte inferior
   - Fondo blanco con sombra sutil
   - Tres botones principales
   - Responsive (en móvil: botones apilados)

3. **Ventana Flotante Opcional** (Modal overlay)
   - Aparece si el usuario intenta aceptar sin scroll
   - Confirmación: "¿Has leído el documento completo?"
   - Opciones: "Sí, continuar" / "No, leer primero"

---

## 📄 Contenido del Documento Legal

### Estructura del Texto (Español, Formato Neutro)

```
CONSENTIMIENTO INFORMADO PARA EL PROCESAMIENTO DE DATOS DE SALUD

Este documento establece los términos bajo los cuales usted autoriza el procesamiento 
de su información de salud personal mediante inteligencia artificial.

INFORMACIÓN DEL PACIENTE
Nombre del paciente: [Nombre]
Fisioterapeuta: [Nombre]
Clínica: [Nombre]
Fecha: [Fecha]

IMPORTANTE: PROCESAMIENTO TRANSFRONTERIZO DE DATOS

Todo el procesamiento mediante inteligencia artificial se realiza en los Estados Unidos 
(región us-central1). No existe procesamiento local de inteligencia artificial en Canadá. 
Todos los datos clínicos enviados para análisis mediante inteligencia artificial cruzarán 
la frontera hacia servidores ubicados en Estados Unidos.

Debido a que todo el procesamiento mediante inteligencia artificial ocurre en los Estados 
Unidos, su información de salud será procesada por servicios de inteligencia artificial 
con sede en Estados Unidos sujetos a las leyes estadounidenses, incluyendo la Ley CLOUD 
de Estados Unidos. Bajo la Ley CLOUD, las autoridades estadounidenses pueden acceder a sus 
datos de salud sin previo aviso. No se aplica soberanía de datos canadiense al 
procesamiento mediante inteligencia artificial.

SUS DERECHOS BAJO PHIPA

Como paciente, usted tiene derecho a conocer cómo procesaremos su información de salud 
personal. Usted tiene derecho a rechazar la documentación asistida por inteligencia 
artificial (disponible entrada manual). Puede solicitar una copia de sus registros en 
cualquier momento. Puede retirar este consentimiento en cualquier momento. Tiene derecho a 
presentar quejas ante el Comisionado de Información y Privacidad de Ontario (IPC).

CÓMO SE PROCESARÁN SUS DATOS

Documentación clínica: registros electrónicos de sus sesiones, notas de evaluación y 
tratamiento, planes de rehabilitación.

Herramientas tecnológicas utilizadas: AiDuxCare, plataforma de documentación asistida por 
inteligencia artificial. Procesamiento: Google Vertex AI (Estados Unidos). Propósito: 
mejorar la precisión y eficiencia de la documentación clínica.

RETENCIÓN DE DATOS

Las grabaciones de audio y las notas generadas por inteligencia artificial se conservarán 
durante 10 años o más según los requisitos del Colegio de Fisioterapeutas de Ontario (CPO) 
para registros clínicos.

OPCIONES DE CONSENTIMIENTO

Usted puede elegir una de las siguientes opciones:

Opción 1: Consentimiento continuo
Aplicar a esta sesión y todas las sesiones futuras con este paciente. Puede retirar el 
consentimiento en cualquier momento en la configuración.

Opción 2: Solo esta sesión
Aplicar el consentimiento solo a esta sesión actual. Se le preguntará nuevamente para 
sesiones futuras.

Opción 3: Rechazar procesamiento mediante inteligencia artificial
Usar solo entrada manual de documentación. Las funciones de inteligencia artificial estarán 
deshabilitadas, pero toda la demás funcionalidad permanecerá disponible. Puede continuar 
usando la herramienta para organizar información y copiarla a su sistema de registros 
médicos electrónicos (EMR).

IMPORTANTE: Si rechaza el procesamiento mediante inteligencia artificial, puede seguir 
usando AiDuxCare para organizar sus notas clínicas. Estas notas pueden exportarse a 
formato compatible con iBooks o copiarse directamente a su EMR. Sin embargo, no se 
realizará análisis automático mediante inteligencia artificial de la información del 
paciente.

Este consentimiento es requerido por PHIPA s. 18 (Ley de Protección de Información de 
Salud Personal, 2004 - Ontario).

Preguntas: Contacte a su clínica o compliance@aiduxcare.com
```

### Características del Texto

- **Fuente:** Sans-serif estándar (Arial, Helvetica, o similar)
- **Tamaño:** 14px base, 16px en móviles
- **Color:** #000000 (negro puro)
- **Interlineado:** 1.6 (espaciado generoso)
- **Sin negritas:** Todo el texto en peso normal
- **Sin cursivas:** Solo texto recto
- **Sin colores destacados:** Todo en negro
- **Sin subrayados:** Excepto enlaces (si los hay)

---

## 🔘 Diseño de Botones de Acción

### Opción 1: Aceptar con IA (Consentimiento Continuo)

**Estados:**
- Normal: Fondo blanco, borde negro, texto negro
- Hover: Fondo negro, texto blanco
- Disabled: Gris claro, cursor no permitido

**Texto del botón:**
```
ACEPTAR CON INTELIGENCIA ARTIFICIAL
(Consentimiento continuo)
```

**Comportamiento:**
- Requiere firma digital (nombre completo)
- Se muestra campo de firma al seleccionar
- Botón se habilita cuando hay firma

### Opción 2: Solo esta Sesión

**Estados:**
- Normal: Fondo blanco, borde gris medio, texto gris oscuro
- Hover: Fondo gris claro

**Texto del botón:**
```
SOLO ESTA SESIÓN
(Se preguntará nuevamente)
```

**Comportamiento:**
- No requiere firma
- Consentimiento solo para sesión actual
- Se guarda en Firestore con scope "session-only"

### Opción 3: Declinar IA

**Estados:**
- Normal: Fondo blanco, borde rojo claro, texto rojo oscuro
- Hover: Fondo rojo muy claro

**Texto del botón:**
```
DECLINAR INTELIGENCIA ARTIFICIAL
(Continuar sin IA)
```

**Comportamiento:**
- No requiere firma
- Guarda consentimiento como "declined"
- Habilita modo "sin IA" en la herramienta
- Muestra mensaje explicativo sobre uso sin IA

---

## 💬 Mensajes y Confirmaciones

### Mensaje al Declinar IA

```
Ha decidido no utilizar el análisis mediante inteligencia artificial.

Puede continuar usando AiDuxCare para:
- Organizar sus notas clínicas manualmente
- Exportar a formato compatible con iBooks
- Copiar contenido a su sistema EMR

Nota: Sin análisis mediante inteligencia artificial, deberá escribir 
directamente en la ficha clínica. La herramienta seguirá disponible 
para organización y exportación.

¿Desea continuar sin análisis mediante inteligencia artificial?
```

### Confirmación de Aceptación Rápida

Si el usuario intenta aceptar sin hacer scroll completo:

```
¿Has leído el documento completo?

Para proporcionar un consentimiento informado válido, es importante 
que hayas leído todo el documento legal.

- Sí, he leído todo → Continuar con aceptación
- No, quiero leer primero → Volver al documento
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Aceptación con IA (Consentimiento Continuo)

```
1. Usuario llega desde SMS
2. Ve documento legal (scrollable)
3. Lee (o no lee completamente)
4. Hace clic en "Aceptar con IA"
5. Si no hizo scroll completo → Modal de confirmación
6. Si confirma → Campo de firma aparece
7. Ingresa nombre completo
8. Botón "Confirmar Consentimiento" se habilita
9. Hace clic → Consentimiento guardado
10. Redirige a workflow con IA habilitada
```

### Flujo 2: Solo esta Sesión

```
1. Usuario llega desde SMS
2. Ve documento legal
3. Hace clic en "Solo esta Sesión"
4. Confirmación rápida (opcional)
5. Consentimiento guardado (scope: session-only)
6. Redirige a workflow con IA habilitada solo para esta sesión
```

### Flujo 3: Declinar IA

```
1. Usuario llega desde SMS
2. Ve documento legal
3. Hace clic en "Declinar IA"
4. Modal explicativo aparece
5. Confirma decisión
6. Consentimiento guardado (scope: declined)
7. Redirige a workflow SIN IA
8. Interfaz muestra modo "sin IA"
9. Opciones disponibles:
   - Escribir notas manualmente
   - Organizar con iBooks
   - Copiar a EMR
```

---

## 🎯 Estrategia de Uso sin IA

### Modo "Sin IA" en la Herramienta

Cuando el paciente declina IA, la herramienta debe:

1. **Mostrar indicador visual claro**
   - Banner: "Modo sin IA activado"
   - Explicación breve: "Análisis automático deshabilitado"

2. **Funcionalidades disponibles:**
   - ✅ Entrada manual de texto
   - ✅ Organización de notas
   - ✅ Exportación a iBooks
   - ✅ Copia a EMR
   - ✅ Guardado local
   - ❌ Análisis automático
   - ❌ Generación SOAP automática
   - ❌ Sugerencias de IA

3. **Opciones de exportación:**
   - Formato Markdown (compatible con iBooks)
   - Formato texto plano
   - Copiar al portapapeles
   - Exportar a PDF

4. **Mensaje contextual:**
   ```
   Nota: Estás usando AiDuxCare en modo sin IA. Todas las funciones 
   de organización y exportación están disponibles, pero el análisis 
   automático mediante inteligencia artificial está deshabilitado.
   
   Puedes cambiar esta configuración en cualquier momento desde la 
   configuración de consentimiento.
   ```

---

## 📱 Responsive Design

### Desktop (> 768px)
- Documento: 60vh altura máxima, scroll vertical
- Botones: Tres botones en fila horizontal
- Espaciado: Generoso entre elementos

### Mobile (< 768px)
- Documento: 50vh altura máxima
- Botones: Tres botones apilados verticalmente
- Texto: Tamaño aumentado a 16px
- Padding: Reducido pero cómodo

---

## ✅ Requisitos de Implementación

### Técnicos
1. Traducción completa al español
2. Formato de texto neutro (sin estilos especiales)
3. Botones siempre visibles (sticky footer)
4. Modal de confirmación opcional
5. Validación de firma para consentimiento continuo
6. Guardado de preferencias en Firestore
7. Modo "sin IA" funcional en workflow

### Legales
1. Cumplimiento con PHIPA s. 18
2. Registro de todas las decisiones de consentimiento
3. Auditoría completa de acciones
4. Posibilidad de retirar consentimiento
5. Información clara sobre derechos del paciente

### UX/UI
1. Lectura clara y comprensible
2. Acciones claras y accesibles
3. Confirmaciones apropiadas
4. Feedback visual inmediato
5. Opciones de salida claras

---

## 🚀 Próximos Pasos

1. **Fase 1: Traducción**
   - Traducir documento completo al español
   - Revisar precisión legal
   - Validar con abogado si es necesario

2. **Fase 2: Diseño UI**
   - Crear mockups de la interfaz
   - Diseñar componentes de botones
   - Diseñar modal de confirmación

3. **Fase 3: Implementación**
   - Actualizar PatientConsentPortalPage
   - Implementar sticky footer
   - Implementar modales
   - Implementar modo "sin IA"

4. **Fase 4: Testing**
   - Probar todos los flujos
   - Validar responsive design
   - Verificar guardado en Firestore
   - Probar modo "sin IA"

---

## 📝 Notas Importantes

- El documento debe ser completamente legible sin necesidad de scroll
- Los botones deben ser accesibles en todo momento
- La decisión del paciente debe ser respetada completamente
- El modo "sin IA" debe ser funcional y útil
- Todas las acciones deben ser auditables

---

**Este diseño prioriza la claridad, la accesibilidad y el respeto por las decisiones del paciente.**

