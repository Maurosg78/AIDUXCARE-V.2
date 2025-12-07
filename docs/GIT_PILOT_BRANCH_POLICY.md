# Política de Rama Única para el Piloto CA-DEC2025

## Regla Principal

**Durante el piloto CA-DEC2025, TODO el trabajo de desarrollo se realiza en UNA SOLA RAMA:**

- **Rama de trabajo:** `piloto-ca-dec2025`
- **Rama de referencia:** `main` (solo para auditoría, NO tocar durante el piloto)

## Prohibiciones

- ❌ **NO crear ramas nuevas** salvo WO explícito del CTO
- ❌ **NO trabajar en `main`** durante el piloto
- ❌ **NO crear ramas de feature** (usar commits directos en `piloto-ca-dec2025`)

## Flujo de Trabajo

### Al iniciar trabajo diario

```bash
cd ~/Dev/AIDUXCARE-V.2

git checkout piloto-ca-dec2025

git pull origin piloto-ca-dec2025
```

### Al hacer cambios

```bash
# Hacer cambios...

git add .

git commit -m "feat/wo-xxx: descripción corta"

git push origin piloto-ca-dec2025
```

### Si accidentalmente estás en otra rama

```bash
git checkout piloto-ca-dec2025

git pull origin piloto-ca-dec2025
```

## Excepciones

Solo el CTO puede autorizar la creación de una rama nueva, y será para casos excepcionales (emergencias, experimentos aislados).

## Verificación

Para verificar en qué rama estás:

```bash
git branch --show-current
```

Debe mostrar: `piloto-ca-dec2025`

## Verificación rápida

Usar el script de sanity check:

```bash
./scripts/git-sanity-check.sh
```

Este script muestra:
- Ruta del repo
- Rama actual
- Remote configurado
- Estado de git (resumen)

## Referencias

- Ver `docs/CANONICAL_BASELINES.md` para información sobre tags canónicos
- Ver `docs/SHELL_PRACTICES_FOR_TEAM.md` para buenas prácticas de shell
- Ver `docs/WO_TEMPLATE_SMALL.md` para plantilla de WOs

