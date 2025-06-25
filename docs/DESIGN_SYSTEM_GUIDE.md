# 🎨 SISTEMA DE DISEÑO AIDUXCARE V.2

## 📋 ÍNDICE

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Principios Fundamentales](#principios-fundamentales)
3. [Sistema de Colores](#sistema-de-colores)
4. [Tipografía](#tipografía)
5. [Espaciado](#espaciado)
6. [Componentes](#componentes)
7. [Animaciones](#animaciones)
8. [Responsive Design](#responsive-design)
9. [Accesibilidad](#accesibilidad)
10. [Implementación Técnica](#implementación-técnica)

---

## 🎯 FILOSOFÍA DE DISEÑO

### Visión
> **"Cobramos por lo que sabemos, no por lo que mostramos. AiDuxCare inspira confianza porque sabe, no porque abruma."**

### Metáfora Clave
La metáfora del "martillazo": el valor no está en la cantidad de acciones visibles, sino en el conocimiento, la experiencia y la certeza de que, cuando ocurre algo, es lo correcto, en el momento justo, con la mínima fricción.

### Inspiración
- **Apple**: Elegancia, simplicidad, atención al detalle
- **Clínicas Premium**: Profesionalismo, confianza, calidez humana
- **Tecnología Médica**: Precisión, confiabilidad, innovación

---

## 🧭 PRINCIPIOS FUNDAMENTALES

### 1. Confianza Silenciosa
- **Menos es más**: Mostrar solo lo esencial en cada momento
- **Presencia sin saturación**: El sistema "sabe" y actúa solo cuando es necesario
- **Intervenciones precisas**: El "martillazo" justo, no el despliegue de herramientas

### 2. Elegancia y Calidez
- **Espacios en blanco**: No tener miedo al "vacío"
- **Detalles cuidados**: Tipografía, iconografía, alineación, transiciones
- **Humanidad**: Calidez en la interacción, profesionalismo en la presentación

### 3. Tecnología Invisible
- **Poder oculto**: El 99% de la complejidad está bajo la superficie
- **Feedback sutil**: Microinteracciones que transmiten que el sistema está atento
- **Anticipación**: El sistema anticipa necesidades y resuelve problemas antes de que se noten

---

## 🎨 SISTEMA DE COLORES

### Paleta Principal
```css
/* Colores principales - Inspirados en Apple y clínicas premium */
--aidux-primary: #1A365D;        /* Azul profundo - confianza */
--aidux-secondary: #2D9C8B;      /* Verde azulado - salud */
--aidux-accent: #F5C16C;         /* Dorado suave - excelencia */
--aidux-warm: #E8B4A0;           /* Coral cálido - humanidad */
```

### Escala de Grises Profesional
```css
--aidux-gray-50: #F7F9FA;        /* Fondo principal */
--aidux-gray-100: #F1F3F4;       /* Fondo secundario */
--aidux-gray-200: #E8EAED;       /* Bordes sutiles */
--aidux-gray-300: #DADCE0;       /* Bordes medios */
--aidux-gray-400: #9AA0A6;       /* Texto secundario */
--aidux-gray-500: #5F6368;       /* Texto principal */
--aidux-gray-600: #3C4043;       /* Texto fuerte */
--aidux-gray-700: #202124;       /* Texto muy fuerte */
--aidux-gray-800: #1C1E21;       /* Texto principal */
--aidux-gray-900: #0F1419;       /* Texto muy fuerte */
```

### Estados Semánticos
```css
--aidux-success: #34A853;        /* Verde éxito */
--aidux-warning: #FBBC04;        /* Amarillo advertencia */
--aidux-error: #EA4335;          /* Rojo error */
--aidux-info: #4285F4;           /* Azul información */
```

### Uso de Colores
- **Primary**: Botones principales, enlaces, elementos de acción
- **Secondary**: Elementos secundarios, estados activos
- **Accent**: Destacados, llamadas a la acción especiales
- **Warm**: Elementos que requieren calidez humana
- **Grises**: Jerarquía visual, fondos, bordes

---

## 📝 TIPOGRAFÍA

### Sistema de Fuentes
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
--font-family-display: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Escala Tipográfica (Ratio 1.25)
```css
--font-size-xs: 0.75rem;         /* 12px */
--font-size-sm: 0.875rem;        /* 14px */
--font-size-base: 1rem;          /* 16px */
--font-size-lg: 1.125rem;        /* 18px */
--font-size-xl: 1.25rem;         /* 20px */
--font-size-2xl: 1.5rem;         /* 24px */
--font-size-3xl: 1.875rem;       /* 30px */
--font-size-4xl: 2.25rem;        /* 36px */
--font-size-5xl: 3rem;           /* 48px */
--font-size-6xl: 3.75rem;        /* 60px */
```

### Pesos de Fuente
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### Altura de Línea
```css
--line-height-tight: 1.25;       /* Títulos */
--line-height-normal: 1.5;       /* Texto normal */
--line-height-relaxed: 1.75;     /* Texto largo */
```

---

## 📏 ESPACIADO

### Sistema de Espaciado (Base: 8px)
```css
--space-0: 0;
--space-1: 0.25rem;              /* 4px */
--space-2: 0.5rem;               /* 8px */
--space-3: 0.75rem;              /* 12px */
--space-4: 1rem;                 /* 16px */
--space-5: 1.25rem;              /* 20px */
--space-6: 1.5rem;               /* 24px */
--space-8: 2rem;                 /* 32px */
--space-10: 2.5rem;              /* 40px */
--space-12: 3rem;                /* 48px */
--space-16: 4rem;                /* 64px */
--space-20: 5rem;                /* 80px */
--space-24: 6rem;                /* 96px */
--space-32: 8rem;                /* 128px */
```

### Principios de Espaciado
- **Consistencia**: Usar siempre valores del sistema
- **Jerarquía**: Más espacio = más importancia
- **Respiración**: Permitir que los elementos "respiren"
- **Agrupación**: Usar espaciado para agrupar elementos relacionados

---

## 🧩 COMPONENTES

### Botones
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-base);
}
```

#### Variantes
- **Primary**: Acciones principales
- **Secondary**: Acciones secundarias
- **Ghost**: Acciones sutiles
- **Tamaños**: sm, base, lg

### Cards
```css
.feature-card {
  background: white;
  border-radius: var(--border-radius-2xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}
```

### Inputs
```css
.input-elegant {
  width: 100%;
  padding: var(--space-4);
  border: var(--border-width-1) solid var(--aidux-gray-300);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  transition: var(--transition-base);
}
```

---

## ✨ ANIMACIONES

### Transiciones
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
--transition-slower: 500ms ease-in-out;
```

### Curvas de Animación
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Animaciones Principales
- **fadeIn**: Aparición suave
- **slideInLeft/Right**: Entrada desde los lados
- **scaleIn**: Escalado suave
- **float**: Flotación sutil

### Principios de Animación
- **Sutileza**: Animaciones que no distraen
- **Propósito**: Cada animación tiene un propósito claro
- **Rendimiento**: Usar transform y opacity para mejor rendimiento
- **Accesibilidad**: Respetar `prefers-reduced-motion`

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Enfoque Mobile-First
1. **Diseñar para móvil primero**
2. **Progresivamente mejorar para pantallas más grandes**
3. **Usar CSS Grid y Flexbox para layouts adaptativos**
4. **Optimizar touch targets (mínimo 44px)**

### Estrategias Responsive
- **Fluid Typography**: `clamp()` para tamaños de fuente
- **Container Queries**: Para componentes adaptativos
- **Grid Adaptativo**: `repeat(auto-fit, minmax())`
- **Espaciado Responsive**: Ajustar padding/margin por breakpoint

---

## ♿ ACCESIBILIDAD

### Estándares
- **WCAG 2.1 AA**: Cumplimiento completo
- **Contraste**: Mínimo 4.5:1 para texto normal
- **Focus Visible**: Indicadores claros de foco
- **Semántica**: HTML semántico correcto

### Implementación
```css
/* Focus visible para accesibilidad */
.focus-visible:focus {
  outline: 2px solid var(--aidux-primary);
  outline-offset: 2px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Consideraciones
- **Reduced Motion**: Respetar preferencias del usuario
- **Color Blindness**: No depender solo del color
- **Keyboard Navigation**: Navegación completa por teclado
- **Screen Readers**: Textos alternativos y ARIA labels

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Estructura de Archivos
```
src/
├── styles/
│   ├── aidux-theme.css          # Sistema de diseño principal
│   ├── welcome.css              # Estilos específicos Welcome Page
│   └── globals.css              # Estilos globales
├── components/
│   └── branding/
│       └── AiDuxCareLogo.tsx    # Logo componente
└── pages/
    └── WelcomePage.tsx          # Página de bienvenida
```

### CSS Custom Properties
- **Design Tokens**: Todas las variables en `:root`
- **Tematic**: Fácil cambio de temas
- **Consistencia**: Valores centralizados
- **Mantenimiento**: Cambios globales desde un lugar

### Mejores Prácticas
1. **BEM Methodology**: Para nomenclatura de clases
2. **CSS Modules**: Para evitar conflictos
3. **PostCSS**: Para optimización y autoprefixer
4. **CSS Grid/Flexbox**: Para layouts modernos
5. **CSS Custom Properties**: Para theming y consistencia

### Herramientas Recomendadas
- **Figma**: Para diseño y prototipado
- **Storybook**: Para documentación de componentes
- **Chromatic**: Para testing visual
- **Lighthouse**: Para auditoría de rendimiento

---

## 🎯 GUÍAS DE USO

### Para Diseñadores
1. **Siempre usar la paleta oficial**
2. **Respetar el sistema de espaciado**
3. **Mantener la jerarquía tipográfica**
4. **Probar en múltiples dispositivos**
5. **Considerar estados de interacción**

### Para Desarrolladores
1. **Usar las variables CSS del sistema**
2. **Seguir la nomenclatura establecida**
3. **Implementar responsive design**
4. **Asegurar accesibilidad**
5. **Optimizar rendimiento**

### Para Product Managers
1. **Validar con usuarios reales**
2. **Mantener consistencia en toda la app**
3. **Considerar el contexto de uso**
4. **Medir impacto en métricas clave**
5. **Iterar basado en feedback**

---

## 📚 RECURSOS ADICIONALES

### Documentación
- [CSS Custom Properties Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Responsive Design Patterns](https://www.lukew.com/ff/entry.asp?1514)

### Herramientas
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [CSS Grid Generator](https://cssgrid-generator.netlify.app/)
- [Flexbox Froggy](https://flexboxfroggy.com/)

### Inspiración
- [Apple Design Resources](https://developer.apple.com/design/)
- [Material Design](https://material.io/design)
- [Ant Design](https://ant.design/docs/spec/introduce)

---

## 🔄 PROCESO DE ITERACIÓN

### Ciclo de Mejora
1. **Análisis**: Identificar áreas de mejora
2. **Diseño**: Crear soluciones visuales
3. **Implementación**: Desarrollar cambios
4. **Testing**: Validar con usuarios
5. **Refinamiento**: Ajustar basado en feedback

### Métricas de Éxito
- **Usabilidad**: Tiempo de tarea, tasa de error
- **Accesibilidad**: Puntuación Lighthouse
- **Rendimiento**: Core Web Vitals
- **Satisfacción**: NPS, feedback cualitativo

---

*Este sistema de diseño es un documento vivo que evoluciona con el producto. Mantener actualizado y compartir cambios con todo el equipo.* 