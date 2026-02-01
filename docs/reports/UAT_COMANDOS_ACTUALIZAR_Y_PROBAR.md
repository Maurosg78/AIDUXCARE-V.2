# Comandos: actualizar todo y comenzar pruebas UAT

Ejecutar **en la raíz del proyecto**. Puedes pegar cada bloque en la terminal.

---

## 1. Actualizar código y dependencias

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean

# Traer últimos cambios
git pull

# Instalar dependencias (usa el gestor del proyecto)
npm install
# o, si usas pnpm:
# pnpm install
```

---

## 2. Limpiar cache y construir

```bash
rm -rf dist .vite
npm run build
# o: pnpm build
```

---

## 3. Opción A — Probar en local (dev + UAT manual)

```bash
# Arrancar app en modo desarrollo (puerto 5174)
npm run dev
# o: pnpm dev
```

Luego en el navegador: `http://localhost:5174` (o la URL que muestre Vite) y ejecutar los casos UAT a mano.

---

## 4. Opción B — Tests E2E (Playwright) contra app local

**Requisito:** instalar los navegadores de Playwright una vez (si no lo has hecho):

```bash
npx playwright install
```

Luego:

```bash
# Terminal 1: emuladores Firebase + app de test
npm run emulators:start
# En otra terminal:
npm run dev:test
# Esperar ~10–15 s y en una tercera terminal:

# Terminal 2: ejecutar E2E
npm run test:e2e:command-centre
# o solo MVP:
npm run test:e2e:happy-path
```

O todo en uno (emuladores + dev + E2E, luego para emuladores a mano):

```bash
npm run test:e2e:local
```

---

## 5. Opción C — Deploy a UAT y probar en entorno real

```bash
# Deploy solo hosting a UAT
firebase deploy --only hosting --project aiduxcare-v2-uat-dev

# O hosting + functions si también actualizas backend
firebase deploy --only hosting,functions --project aiduxcare-v2-uat-dev
```

Después: abrir **https://aiduxcare-v2-uat-dev.web.app** (o la URL de tu proyecto UAT), hacer **Empty cache and hard reload** (o Cmd+Shift+R) y ejecutar los casos UAT.

---

## Secuencia completa: actualizar + build + deploy UAT

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
git pull
npm install
rm -rf dist .vite
npm run build
firebase deploy --only hosting --project aiduxcare-v2-uat-dev
```

---

## Verificación pre-deploy (lint, typecheck, build, E2E)

**Completa (incluye typecheck):**
```bash
npm run verify:deploy
```

**Sin typecheck** (lint + build + E2E):
```bash
npm run verify:deploy:no-typecheck
```

**Solo lint + build** (sin E2E; útil para dejar listo para deploy UAT cuando los E2E fallan por entorno):
```bash
npm run verify:deploy:lint-build
```

*(`verify:deploy` = lint + typecheck + build + E2E. `verify:deploy:no-typecheck` omite typecheck. `verify:deploy:lint-build` solo lint + build.)*

---

## Resumen rápido

| Objetivo              | Comando principal                                      |
|-----------------------|--------------------------------------------------------|
| Instalar browsers E2E | `npx playwright install` (una vez)                     |
| Verificación solo lint+build | `npm run verify:deploy:lint-build`              |
| Actualizar y construir| `git pull && npm install && rm -rf dist .vite && npm run build` |
| Probar en local       | `npm run dev`                                          |
| E2E (Playwright)      | `npm run test:e2e:command-centre` o `npm run test:e2e:local` |
| Deploy a UAT          | `firebase deploy --only hosting --project aiduxcare-v2-uat-dev` |
| Todo: actualizar → UAT| Secuencia completa de la sección 5 arriba              |
