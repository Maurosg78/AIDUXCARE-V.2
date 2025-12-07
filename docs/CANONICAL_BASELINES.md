# Canonical Baselines – AIDUXCARE V2

Este documento define los puntos de referencia "canónicos" del sistema.
Si algo se corrompe o hay dudas, estos tags son las fotos de referencia.

## Lista de baselines

| Tag                         | Rama base             | Fecha       | Descripción                                        |
|-----------------------------|-----------------------|------------|----------------------------------------------------|
| canon-pilot-ca-dec2025-v1   | piloto-ca-dec2025     | 2025-12-07 | Primera baseline canónica del piloto CA-DEC2025. Incluye pipeline de PDFs (imaging) funcionando y documentación de readiness. |

## Cuándo crear un tag canónico

Crear un tag canónico en los siguientes casos:

- ✅ **Final de día importante** (ej: demo completada, milestone alcanzado)
- ✅ **Fin de WO grande** (ej: "PDF pipeline completo y probado")
- ✅ **Antes de cambios arriesgados** (ej: refactor grande, migración)
- ✅ **Hito de piloto** (ej: "3 pacientes procesados exitosamente")

## Convención de nombres

- Formato: `canon-pilot-ca-dec2025-vN`
- Versión incremental: `v1`, `v2`, `v3`, ...
- Siempre tag anotado (con mensaje descriptivo)

## Proceso para crear un nuevo tag canónico

### Paso 1: Verificar estado limpio

```bash
cd ~/Dev/AIDUXCARE-V.2

git status
```

El árbol debe estar limpio (sin cambios sin commitear).

### Paso 2: Revisar últimos commits

```bash
git log --oneline -3
```

Confirmar que estás en el commit correcto.

### Paso 3: Crear el tag anotado

```bash
git tag -a canon-pilot-ca-dec2025-v2 -m "Baseline piloto CA DEC 2025 v2: [descripción breve]"
```

Reemplazar `v2` por el siguiente número de versión.

### Paso 4: Push del tag a GitHub

```bash
git push origin canon-pilot-ca-dec2025-v2
```

### Paso 5: Actualizar este documento

Añadir la nueva entrada en la tabla de baselines con:
- Tag creado
- Fecha
- Descripción breve del hito

## Uso

- Para inspeccionar el estado exacto de una baseline:

  ```bash
  git checkout canon-pilot-ca-dec2025-v1
  ```

* Para volver al trabajo normal del piloto:

  ```bash
  git checkout piloto-ca-dec2025
  ```

## Verificación rápida

Usar el script de sanity check:

```bash
./scripts/git-sanity-check.sh
```

Este documento se actualizará cada vez que se cree una nueva baseline importante.

