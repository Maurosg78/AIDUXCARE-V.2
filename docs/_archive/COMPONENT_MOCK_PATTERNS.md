# Patrones para Componentes Mock en React

## Contexto
Este documento describe los patrones y soluciones implementados para manejar componentes mock en React, específicamente para casos donde necesitamos:
- Implementar versiones simplificadas de componentes de UI
- Manejar tipos de TypeScript correctamente
- Gestionar propiedades como `displayName`
- Resolver problemas comunes de linting

## Patrón Base

### 1. Configuración Inicial
```typescript
/* eslint-disable react/display-name */
/* eslint-disable jsx-a11y/aria-props */
import React, { ReactNode, forwardRef } from 'react';
```

### 2. Tipos Base
```typescript
// Tipo base para componentes con displayName
type ComponentWithDisplayName<P = Record<string, never>> = React.FC<P> & {
  displayName?: string;
};

// Función helper para establecer displayName de manera segura
const setDisplayName = <T extends React.ComponentType<any>>(component: T, name: string): T => {
  Object.defineProperty(component, 'displayName', { value: name });
  return component;
};
```

### 3. Componentes Compuestos
```typescript
// Interfaz para componentes compuestos
interface CompositeComponent extends React.FC<{ children: ReactNode }> {
  SubComponent: React.FC<{ children: ReactNode }>;
  // ... otros subcomponentes
}

// Implementación
export const Component = setDisplayName(({ children }) => {
  return <div>{children}</div>;
}, 'Component') as CompositeComponent;

Component.SubComponent = setDisplayName(({ children }) => {
  return <div>{children}</div>;
}, 'Component.SubComponent');
```

## Casos de Uso Comunes

### 1. Componentes con forwardRef
```typescript
export const Button = setDisplayName(
  forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(
    ({ children, ...props }, ref) => {
      return (
        <button ref={ref} {...props}>
          {children}
        </button>
      );
    }
  ),
  'Button'
);
```

### 2. Componentes con Props Específicas
```typescript
interface CustomProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}

export const Switch = setDisplayName(
  forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & CustomProps>(
    ({ checked, onChange, children, ...props }, ref) => {
      return (
        <button
          ref={ref}
          role="switch"
          aria-checked={checked ? 'true' : 'false'}
          {...props}
        >
          {children}
        </button>
      );
    }
  ),
  'Switch'
);
```

## Consideraciones Importantes

### 1. Manejo de Errores de Linting
- Usar `eslint-disable` específico para reglas que no aplican a mocks
- Documentar por qué se deshabilitan ciertas reglas
- Mantener las reglas de accesibilidad en componentes reales

### 2. Tipos y TypeScript
- Usar `Record<string, never>` en lugar de `{}` para tipos vacíos
- Definir interfaces claras para componentes compuestos
- Utilizar `as const` para valores literales cuando sea necesario

### 3. Buenas Prácticas
- Mantener los mocks lo más simples posible
- Documentar las limitaciones de los mocks
- Usar nombres descriptivos para facilitar el debugging
- Implementar solo la funcionalidad necesaria

## Ejemplo Completo
```typescript
// Componente mock completo con subcomponentes
interface DisclosureComponent extends React.FC<{ children: ReactNode }> {
  Button: React.ForwardRefExoticComponent<ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>;
  Panel: React.FC<{ children: ReactNode }>;
}

export const Disclosure = setDisplayName(({ children }) => {
  return <div>{children}</div>;
}, 'Disclosure') as DisclosureComponent;

Disclosure.Button = setDisplayName(
  forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(
    ({ children, ...props }, ref) => (
      <button ref={ref} {...props} type="button">
        {children}
      </button>
    )
  ),
  'Disclosure.Button'
);

Disclosure.Panel = setDisplayName(({ children }) => {
  return <div>{children}</div>;
}, 'Disclosure.Panel');
```

## Notas Adicionales
- Los mocks deben ser lo más simples posible
- Mantener la consistencia en el nombramiento
- Documentar las limitaciones y comportamientos esperados
- Considerar el impacto en el testing y debugging 