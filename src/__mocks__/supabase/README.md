# Mocks de Supabase para Tests

Este directorio contiene implementaciones de mocks para el cliente de Supabase, diseñados para ser utilizados en tests unitarios y de integración.

## Motivación

Cuando ejecutamos pruebas en entornos CI como GitHub Actions, las variables de entorno `SUPABASE_URL` y `SUPABASE_ANON_KEY` no están disponibles, lo que puede causar errores en los tests que intentan usar el cliente de Supabase real.

## Solución implementada

Se han implementado tres niveles de mocks para Supabase:

### 1. Mock Global (setupTests.ts)

En el archivo `src/setupTests.ts` se ha configurado un mock global que se aplica a todos los tests automáticamente. Este mock proporciona implementaciones básicas de los métodos más comunes de Supabase, devolviendo datos vacíos y sin errores.

### 2. Utilidades para Mocks Específicos (supabaseTestUtils.ts)

El archivo `supabaseTestUtils.ts` proporciona funciones de utilidad para crear mocks más específicos y personalizados para cada archivo de test.

```typescript
import { configureSupabaseMock } from '../../__mocks__/supabase/supabaseTestUtils';

// Al inicio del archivo de prueba, antes de importar los componentes
vi.mock('@/core/auth/supabaseClient', () => ({
  default: configureSupabaseMock({
    data: { custom: 'data' },
    session: { user: { id: 'test-user-id' } }
  })
}));
```

### 3. Mocks individuales para cada archivo de test

Para casos específicos, puedes definir mocks directamente en cada archivo de test, antes de importar los componentes que usan Supabase:

```typescript
// Mock para supabaseClient
vi.mock('@/core/auth/supabaseClient', () => {
  return {
    default: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: {}, error: null }),
          }),
        }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    },
  };
});

// Ahora puedes importar tus componentes
import MiComponente from '../MiComponente';
```

## Notas importantes

1. Asegúrate de colocar el mock **antes** de importar los componentes que usan Supabase, para que el mock se aplique antes de que se resuelvan las importaciones.

2. Es mejor tener un mock más específico y adaptado a las necesidades de tu test particular que usar el mock global.

3. Los mocks individuales tienen prioridad sobre el mock global, por lo que puedes sobrescribir el comportamiento global para un test específico.

4. Recuerda que los mocks se limpian automáticamente después de cada test mediante `vi.clearAllMocks()` en el `afterEach` del `setupTests.ts`. 