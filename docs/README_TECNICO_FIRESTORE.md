# Documentación Técnica Enterprise: Integración Firestore y CI/CD

## Resumen Ejecutivo

Este documento describe el flujo de trabajo profesional para la integración de Firestore en AiDuxCare V.2, incluyendo orquestación de emulador, tests automáticos, compliance y troubleshooting. El objetivo es asegurar reproducibilidad, calidad hospitalaria y cumplimiento HIPAA/GDPR en todos los entornos (local y CI/CD).

---

## [NUEVO] Registro de Limpieza y Migración MCP Legacy (Julio 2025)

- Eliminados todos los módulos y tests legacy de Supabase (`MCPDataSourceSupabase.ts`, `MCPDataSourceSupabase.test.ts`).
- Refactorizados los tests de MCPManager a estructura Firestore-only.
- Confirmada la ausencia de dependencias activas a Supabase en MCP.
- Checklist de migración y limpieza actualizado en el roadmap.
- Arquitectura MCP ahora 100% Firestore-ready, sin deuda técnica legacy.

---

## Diagrama de Orquestación (Mermaid)

```mermaid
graph TD
    A[Checkout repo] --> B[Setup Node.js]
    B --> C[Install dependencies]
    C --> D[Crear .env.local]
    D --> E[Instalar Java y Firebase CLI]
    E --> F[Arrancar emulador Firestore]
    F --> G[Esperar emulador (127.0.0.1 y localhost)]
    G --> H[Run Firestore Integration Tests]
    H --> I[Mostrar log si falla]
    I --> J[Stop Firestore Emulator]
```

---

## Detalle de Pasos del Workflow

1. **Checkout repo**: Clona el repositorio y asegura el contexto limpio.
2. **Setup Node.js**: Usa Node 18 para máxima compatibilidad.
3. **Install dependencies**: Instala dependencias con `npm ci --legacy-peer-deps`.
4. **Crear .env.local**: Variables mock para entorno seguro y reproducible.
5. **Instalar Java y Firebase CLI**: Requisito para el emulador Firestore.
6. **Arrancar emulador Firestore**: 
   - Usa `firebase emulators:start` con import/export en `emulator-data`.
   - Sleep 10s para robustez.
7. **Esperar emulador**: 
   - `wait-on` en ambos endpoints (`127.0.0.1` y `localhost`) para máxima compatibilidad CI/CD.
8. **Run Firestore Integration Tests**: 
   - Ejecuta tests de integración con Vitest sobre el emulador.
   - Imprime log del emulador para auditoría.
9. **Mostrar log si falla**: Log completo disponible ante cualquier error.
10. **Stop Firestore Emulator**: Mata el proceso para limpieza.

---

## Compliance y Seguridad

- **HIPAA/GDPR**: No se usan datos reales, solo mocks y datos aleatorios.
- **Reglas de Firestore**: Versionadas y validadas en cada pipeline.
- **Logs**: Sin datos sensibles, listos para auditoría.
- **Configuración**: `firebase.json`, `.firebaserc`, `firestore.rules` bajo control de cambios.

---

## Troubleshooting y FAQ

- **Timeout en wait-on**: Verifica endpoints, sleep y logs del emulador.
- **Emulador no arranca**: Revisa instalación de Java/Firebase CLI y permisos de archivos.
- **Tests fallan solo en CI**: Asegura variables de entorno y mocks correctos.
- **Logs vacíos**: Forzar impresión con `cat /tmp/emulator.log`.

---

## Buenas Prácticas y Extensibilidad

- Mantener este flujo para todos los data sources críticos.
- Versionar reglas y configuración de emulador.
- Documentar cada cambio relevante en el workflow.
- Revisar logs de emulador en cada auditoría.
- Extender el patrón a otros servicios (Auth, Functions, etc.)

---

## Recomendaciones Futuras

- Reactivar pasos de lint/build/unitarios para pipeline full.
- Automatizar generación de reportes de cobertura y compliance.
- Preparar materiales ejecutivos para auditoría y dirección. 