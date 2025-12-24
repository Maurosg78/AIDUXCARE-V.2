# Desarrollo en Windows - Setup Guide

## Requisitos del Sistema

### Node.js

**Versión requerida:** Node.js **20.19.x** (LTS)

El proyecto está configurado para Node.js 20.19.x según `package.json`:
```json
"engines": {
  "node": ">=20.19 <21"
}
```

**⚠️ Advertencia:** Usar Node.js v24+ puede causar incompatibilidades con dependencias.

### Instalación Recomendada

#### Opción 1: nvm-windows (Recomendado)

1. Descargar nvm-windows desde: https://github.com/coreybutler/nvm-windows/releases
2. Instalar Node.js 20.19.x:
   ```powershell
   nvm install 20.19.0
   nvm use 20.19.0
   ```
3. Verificar:
   ```powershell
   node -v  # Debe mostrar v20.19.x
   ```

#### Opción 2: Instalador Directo

1. Descargar Node.js 20.19.x LTS desde: https://nodejs.org/
2. Durante la instalación, marcar **"Add to PATH"**
3. Reiniciar PowerShell después de instalar

### pnpm

**Versión recomendada:** pnpm 10.x

Instalación:
```powershell
npm install -g pnpm
```

Verificar:
```powershell
pnpm -v  # Debe mostrar 10.x
```

## Verificación del Setup

Ejecutar estos comandos para verificar que todo está correcto:

```powershell
node -v      # Debe ser v20.19.x
npm -v       # Debe funcionar
pnpm -v      # Debe funcionar
git --version # Debe funcionar
```

## Problemas Comunes

### Node.js v24+ detectado

Si ves el warning:
```
WARN Unsupported engine: wanted: {"node":">=20.19 <21"} (current: {"node":"v24.12.0"})
```

**Solución:** Cambiar a Node.js 20.19.x usando nvm-windows o reinstalar Node.js 20 LTS.

### pnpm no reconocido

Si `pnpm` no funciona después de instalarlo:

1. Cerrar y abrir PowerShell
2. Verificar PATH:
   ```powershell
   $env:Path -split ';' | Select-String -Pattern "npm"
   ```
3. Si no aparece, agregar manualmente:
   - `C:\Users\<tu-usuario>\AppData\Roaming\npm`

### Pre-commit hook falla

El hook pre-commit está configurado para ser cross-platform:
- En Windows sin bash: salta la verificación de SoT trailers (solo muestra warning)
- La verificación completa se ejecuta en CI o en el hook pre-push

Si necesitas ejecutar la verificación completa manualmente:
```powershell
# Solo validación Zod (cross-platform)
npm run validate:data:zod

# Verificación completa (requiere bash/Git Bash)
bash scripts/check-sot-trailers.sh
```

## Scripts Útiles

```powershell
# Test gate (validación mínima)
pnpm test:gate

# Validación de datos (Zod)
npm run validate:data:zod

# Tests unitarios
pnpm test:run

# Desarrollo
pnpm dev
```

## Notas

- El proyecto usa **pnpm**, no npm. No ejecutar `npm install` directamente.
- Los hooks de git están configurados para ser cross-platform.
- En Windows, algunos scripts bash pueden no ejecutarse, pero los tests y validaciones principales funcionan.

