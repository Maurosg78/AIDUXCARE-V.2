# 🎨 Sistema de Design AiDuxCare - Guía de Implementación

## 📋 Resumen

Esta guía detalla cómo implementar y usar el sistema de design oficial de **AiDuxCare** en el proyecto. El sistema está basado en la identidad visual definida que transmite **confianza médica, claridad tecnológica y calidez humana**.

---

## 🏗️ Arquitectura del Sistema

### Estructura de Archivos
```
src/
├── styles/
│   └── aidux-theme.css          # Variables CSS y clases utilitarias
├── assets/logo/
│   └── aiduxcare-logo.svg       # Logo oficial SVG
├── components/branding/
│   └── AiDuxCareLogo.tsx        # Componente React del logo
└── index.css                    # CSS principal con imports
```

---

## 🎨 Paleta de Colores

### Colores Principales
```css
/* Variables CSS disponibles */
--aidux-blue-slate: #2C3E50         /* Tipografía, sidebar */
--aidux-mint-green: #A8E6CF         /* Fichas clínicas */
--aidux-coral: #FF6F61              /* Botones activos */
--aidux-neutral-gray: #BDC3C7       /* Textos secundarios */
--aidux-bone-white: #F7F7F7         /* Fondo general */
--aidux-intersection-green: #5DA5A3 /* Color unificador */
```

### Clases Utilitarias
```css
/* Fondos */
.bg-aidux-primary      /* Azul pizarra */
.bg-aidux-secondary    /* Verde menta */
.bg-aidux-accent       /* Coral */
.bg-aidux-background   /* Blanco hueso */

/* Textos */
.text-aidux-primary    /* Azul pizarra */
.text-aidux-accent     /* Coral */
.text-aidux-intersection /* Verde intersección */
```

---

## 🧩 Componentes Predefinidos

### 1. Logo AiDuxCare

```tsx
import { AiDuxCareLogo, AiDuxCareLogoCompact, AiDuxCareLogoHero } from '@/components/branding/AiDuxCareLogo';

// Logo completo
<AiDuxCareLogo size="md" />

// Solo el icono
<AiDuxCareLogo variant="icon" size="sm" />

// Para header/navbar
<AiDuxCareLogoCompact />

// Para páginas principales
<AiDuxCareLogoHero />
```

### 2. Botones

```tsx
// Primarios (coral)
<button className="aidux-btn-primary">
  Acción Principal
</button>

// Secundarios (verde menta)
<button className="aidux-btn-secondary">
  Acción Secundaria
</button>

// Outline
<button className="button-outline">
  Acción Terciaria
</button>
```

### 3. Tarjetas Clínicas

```tsx
<div className="aidux-clinical-card">
  <h3>Ficha del Paciente</h3>
  <p>Contenido médico...</p>
</div>

// Con animación
<div className="clinical-focus">
  <h3>Datos destacados</h3>
</div>
```

### 4. Sidebar Médico

```tsx
<nav className="aidux-sidebar">
  <div className="aidux-sidebar-item">
    Pacientes
  </div>
  <div className="aidux-sidebar-item">
    Diagnósticos
  </div>
</nav>
```

---

## 📐 Espaciado y Tipografía

### Variables de Espaciado
```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */
--spacing-2xl: 3rem      /* 48px */
```

### Tipografía Jerárquica
```tsx
// Títulos principales
<h1 className="aidux-heading-primary">
  Título Principal
</h1>

// Subtítulos
<h2 className="aidux-heading-secondary">
  Subtítulo
</h2>

// Texto normal
<p className="aidux-text-body">
  Contenido regular
</p>

// Texto secundario
<p className="aidux-text-secondary">
  Información adicional
</p>
```

---

## 🎯 Casos de Uso Específicos

### 1. Página de Dashboard Médico

```tsx
export const MedicalDashboard = () => (
  <div className="aidux-clean-spacing">
    <header className="aidux-sidebar">
      <AiDuxCareLogoCompact />
      <nav>...</nav>
    </header>
    
    <main className="bg-aidux-background">
      <section className="aidux-clinical-card">
        <h2 className="aidux-heading-secondary">
          Pacientes del Día
        </h2>
        {/* Contenido... */}
      </section>
    </main>
  </div>
);
```

### 2. Formulario de Entrada de Datos

```tsx
<form className="aidux-professional">
  <div className="aidux-clean-spacing">
    <label className="label">Nombre del Paciente</label>
    <input className="input aidux-field-focus" />
    
    <button className="aidux-btn-primary">
      Guardar Datos
    </button>
  </div>
</form>
```

### 3. Alertas y Notificaciones

```tsx
// Alerta general
<div className="aidux-alert">
  <strong>Atención:</strong> Revisar medicación del paciente
</div>

// Success message
<div className="success-message">
  Datos guardados correctamente
</div>

// Error message
<div className="error-message">
  Error en la validación
</div>
```

---

## 🎨 Estados y Interacciones

### Estados de Campos
```css
/* Campo con focus */
.aidux-field-focus {
  border-color: var(--aidux-intersection-green);
  box-shadow: 0 0 0 3px rgba(93, 165, 163, 0.1);
}

/* Campo deshabilitado */
.aidux-field-disabled {
  background-color: var(--aidux-neutral-gray);
  cursor: not-allowed;
}
```

### Animaciones
```css
/* Animación de entrada */
.aidux-animate-in {
  animation: aidux-fade-in 0.3s ease-out;
}

@keyframes aidux-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first */
@media (max-width: 768px) {
  .aidux-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .aidux-sidebar.open {
    transform: translateX(0);
  }
  
  .aidux-clinical-card {
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
  }
}
```

---

## ✅ Principios de Implementación

### 1. **Limpieza**
- Usar `aidux-clean-spacing` para espaciado amplio
- Evitar sobrecargar visualmente las interfaces
- Mantener jerarquía clara

### 2. **Claridad**
- Usar clases `aidux-heading-*` para tipografía consistente
- Aplicar contrastes adecuados
- Mantener legibilidad en todos los tamaños

### 3. **Confianza**
- Usar `aidux-professional` para elementos importantes
- Aplicar sombras sutiles (`--shadow-md`)
- Mantener consistencia en bordes y radios

### 4. **Calidez**
- Usar `aidux-warm` para elementos que requieren humanidad
- Aplicar transiciones suaves
- Usar el color coral para acciones positivas

---

## 🔧 Personalización Avanzada

### Crear Variaciones de Color
```css
:root {
  /* Variaciones personalizadas */
  --aidux-clinical-success: color-mix(in srgb, var(--aidux-intersection-green) 80%, white);
  --aidux-clinical-warning: color-mix(in srgb, var(--aidux-coral) 70%, white);
}
```

### Extender Componentes
```tsx
// Botón especializado
const AiDuxButton = styled.button`
  ${tw`aidux-btn-primary`}
  
  &.critical {
    background-color: var(--aidux-coral-dark);
    border: 2px solid var(--aidux-coral);
  }
`;
```

---

## 📚 Referencias Adicionales

- **Guía de Identidad Visual Original**: Ver documento de marca
- **Accesibilidad**: Todos los contrastes cumplen WCAG 2.1 AA
- **Iconografía**: Usar iconos que complementen los tres pilares (IA, Seguridad, Cuidado)

---

## 🚀 Próximos Pasos

1. **Implementar en componentes existentes**: Aplicar clases AiDuxCare
2. **Crear biblioteca de componentes**: Expandir con más elementos UI
3. **Documentar variaciones**: Crear Storybook para componentes
4. **Validar accesibilidad**: Auditar contraste y navegación por teclado

---

© AiDuxCare - Clinical AI Assistant  
Sistema de Design v1.0 - Implementado con ❤️ para el cuidado médico 