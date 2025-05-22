# Reglas de contribución

- No se permite `any` en el código fuente principal (`src/`).
- El uso de `any` está permitido **solo** en archivos de tests (`__tests__`), mocks (`__mocks__`) y scripts utilitarios (`scripts/`), según la configuración de ESLint.
- Todo debe estar tipado en el código de producción.
- Cada PR debe pasar linting, testing y revisión.
- Usar carpetas por responsabilidad (core, features, shared, etc.).

## Uso de `any` en el proyecto

El uso de `any` está **estrictamente prohibido** en el código fuente principal para garantizar la seguridad de tipos y la calidad del software. Sin embargo, se permite en los siguientes casos:

- **Tests (`__tests__`)**: Para facilitar la simulación de datos y la flexibilidad en pruebas.
- **Mocks (`__mocks__`)**: Para crear objetos simulados sin necesidad de tipado estricto.
- **Scripts (`scripts/`)**: Para utilidades internas, migraciones o generación de datos donde el tipado estricto no aporta valor.

Esta política está reflejada en la configuración de ESLint (`.eslintrc.json`) mediante la regla `overrides`.

**Importante:** Si encuentras un caso donde crees que el uso de `any` es necesario en el código fuente principal, discútelo primero con el equipo antes de hacer un PR.
