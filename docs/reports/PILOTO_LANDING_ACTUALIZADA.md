# Piloto: que sirva la landing actual (tres tarjetas, azul)

**Problema:** En `pilot.aiduxcare.com` se ve la landing **antigua** (verde/gris, dos tarjetas) en lugar de la **actual** (tres tarjetas, gama azul — "Welcome to AiduxCare", Hospital Patient, Private Practice, Get Started).

**Causa:** En `origin/main` la ruta `/` sigue usando `HospitalPortalLandingPage` (dos tarjetas). La landing nueva (`UnifiedLandingPage`, tres tarjetas) está en la rama de piloto (ej. `chore/piloto-prioridades-cto`). Si el VPS hace build desde `main`, sirve la antigua.

---

## Qué hacer

### 1. Desplegar build reciente en el piloto (VPS)

Para que se vea la **landing de tres tarjetas**, el VPS debe construir desde la **rama que tiene** `UnifiedLandingPage` en `/`, no desde `main`:

```bash
cd /var/www/pilot
git fetch origin
git checkout chore/piloto-prioridades-cto   # rama con landing nueva
git reset --hard origin/chore/piloto-prioridades-cto
npm install
npm install pdfjs-dist   # si en esa rama no está en package.json de main
npm run build
pm2 restart pilot-web
```

Si en el futuro merges esa rama a `main`, podrás volver a usar `git checkout main` y `git reset --hard origin/main` en el VPS.

Si el piloto usa **Firebase Hosting**, desplegar desde local:

```bash
npm run build
npx firebase deploy --only hosting --project <proyecto-piloto>
```

### 2. No cachear index.html en el servidor

- **Firebase:** En `firebase.json` ya está `Cache-Control: no-cache` para `/index.html` y `/sw.js`.
- **VPS con nginx:** Asegurar que la ubicación que sirve el SPA envíe para `/` e `/index.html`:
  `add_header Cache-Control "no-cache, no-store, must-revalidate";`

### 3. Usuarios que siguen viendo la landing antigua

Pedirles:

- **Hard refresh:** `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac).
- O en Chrome: DevTools → Application → Storage → **Clear site data** para `pilot.aiduxcare.com`.

---

## Referencia en código

- Landing **actual** (tres tarjetas, azul): `UnifiedLandingPage.tsx`, ruta `/` en `router.tsx`.
- Service Worker: `public/sw.js` con `CACHE_NAME = 'aiduxcare-v3'`; en cada activación borra cachés antiguos y no cachea `index.html`.
