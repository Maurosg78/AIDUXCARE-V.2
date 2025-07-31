# Componente AgentSuggestionExplainer

## Descripción
El componente `AgentSuggestionExplainer` es un componente accesible que muestra explicaciones para sugerencias del agente. Está diseñado siguiendo las mejores prácticas de accesibilidad y patrones de UX modernos.

## Características de Accesibilidad

### 1. Estructura Semántica
```tsx
<section 
  className="mt-2" 
  aria-label="Explicación de la sugerencia"
  aria-live="polite"
>
```
- Uso de `<section>` en lugar de `<div>` para mejor semántica HTML5
- `aria-label` para identificar el propósito de la sección
- `aria-live="polite"` para anuncios no intrusivos

### 2. Botón de Explicación
```tsx
<button 
  aria-expanded={state.isExpanded}
  aria-label={state.isExpanded ? 'Ocultar explicación' : 'Ver explicación'}
  aria-controls="explanation-content"
>
```
- `aria-expanded` para indicar el estado del acordeón
- `aria-label` dinámico según el estado
- `aria-controls` para relacionar el botón con el contenido

### 3. Manejo de Estados
```tsx
<div
  id="explanation-content"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {state.error ? (
    <div role="alert">
      {state.error}
      <button aria-label="Reintentar obtener explicación">
        Reintentar
      </button>
    </div>
  ) : (
    state.explanation
  )}
</div>
```
- `role="status"` para contenido dinámico normal
- `role="alert"` para mensajes de error
- `aria-atomic="true"` para anunciar el contenido completo

## Mejores Prácticas Implementadas

### 1. Manejo de Errores
- Mensajes de error claros y específicos
- Botón de reintentar con etiqueta descriptiva
- Roles ARIA apropiados para cada estado

### 2. Estados de Carga
```tsx
<div 
  role="status"
  aria-live="polite"
>
  <div aria-hidden="true"></div>
  Cargando explicación...
</div>
```
- Indicador visual de carga
- Texto descriptivo para lectores de pantalla
- Elementos decorativos ocultos con `aria-hidden`

### 3. Navegación por Teclado
- Botones con `type="button"`
- Estados `disabled` apropiados
- Enfoque visible y manejable

## Consideraciones para Desarrolladores

### 1. Modificación de Roles ARIA
- Mantener la jerarquía de roles
- Usar `role="status"` para contenido dinámico normal
- Usar `role="alert"` solo para errores que requieren atención

### 2. Manejo de Estados
- Mantener la consistencia en los anuncios
- Usar `aria-live="polite"` para contenido no urgente
- Considerar el impacto en la experiencia del usuario

### 3. Testing
- Verificar la accesibilidad con lectores de pantalla
- Probar la navegación por teclado
- Validar los anuncios de cambios de estado

## Ejemplos de Uso

### Caso Básico
```tsx
<AgentSuggestionExplainer suggestion={suggestion} />
```

### Con Manejo de Errores
```tsx
// El componente maneja automáticamente:
// - Errores de red
// - Timeouts
// - Errores desconocidos
```

## Recursos Adicionales
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Web Docs - ARIA](https://developer.mozilla.org/es/docs/Web/Accessibility/ARIA)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/) 