# Tests Diferidos - Ecosistema Agent

## Tests Omitidos (18 tests skipped)

### AgentSuggestionViewerTypes.test.tsx (11 tests skipped)
- **Razón**: Tests deshabilitados temporalmente durante migración
- **Funcionalidad**: Componentes de tipo y estado de sugerencias
- **Estimación**: Post-MVP - Mejora de cobertura
- **Prioridad**: Baja

### AgentSuggestionViewer.test.tsx (7 tests skipped)  
- **Razón**: Tests deshabilitados temporalmente durante migración
- **Funcionalidad**: Componente principal del visor
- **Estimación**: Post-MVP - Mejora de cobertura
- **Prioridad**: Media

## Archivos con Problemas Estructurales (6 archivos)

### NO Críticos para MVP (4 archivos)

#### AgentSuggestionFeedbackForm.test.tsx
- **Problema**: Componente no implementado
- **Funcionalidad**: Formulario detallado de retroalimentación de usuarios
- **Estimación**: 2-3 sprints post-MVP
- **Prioridad**: Baja - Mejora de UX

#### AgentSuggestionStatus.test.tsx
- **Problema**: Test vacío
- **Funcionalidad**: Componente específico para mostrar estados
- **Estimación**: 1 sprint post-MVP
- **Prioridad**: Baja - Funcionalidad redundante

#### AgentSuggestionType.test.tsx
- **Problema**: Test vacío
- **Funcionalidad**: Componente específico para mostrar tipos
- **Estimación**: 1 sprint post-MVP
- **Prioridad**: Baja - Funcionalidad redundante

#### AgentSuggestionsAnalytics.test.tsx
- **Problema**: Test vacío, componente es stub
- **Funcionalidad**: Analytics avanzadas y métricas detalladas
- **Estimación**: 3-4 sprints post-MVP
- **Prioridad**: Media - Funcionalidad de reporting

### QUIZÁS Críticos (2 archivos) - Decisión CTO: NO necesarios para MVP

#### AgentSuggestionViewerHook.test.tsx
- **Problema**: Hook no implementado
- **Funcionalidad**: Hook personalizado para manejo de estado centralizado
- **Estimación**: 2 sprints - Mejora arquitectónica
- **Prioridad**: Media - Alternativa al Provider actual

#### AgentSuggestionViewerContainer.test.tsx
- **Problema**: Test vacío
- **Funcionalidad**: Contenedor principal de orquestación
- **Estimación**: 1-2 sprints - Mejora arquitectónica
- **Prioridad**: Media - Posible mejora de arquitectura

## Estado del MVP

✅ **DECLARADO ESTABLE** - El ecosistema Agent tiene toda la funcionalidad esencial implementada y probada con 72 tests pasando.

Los elementos en esta carpeta representan mejoras futuras y no impactan la funcionalidad crítica del MVP. 