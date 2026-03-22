# Despliegue automático a pilot (GitHub Actions)

El workflow **Test and deploy pilot** (`.github/workflows/deploy-pilot.yml`) hace:

1. **verify:** `pnpm install` → `lint:prod` → `typecheck` → `build` → `pnpm test` (Vitest). Si algo falla, **no** se despliega.
2. **deploy:** SSH al VPS → `git fetch` / `reset --hard` a la rama configurada → build con `VITE_ENABLE_ES_PILOT=true` → `pm2 restart pilot-web`.

## Cuándo se ejecuta

- **Push** a la rama `stable`.
- **Manual:** Actions → *Test and deploy pilot* → *Run workflow*.

Si tu piloto sigue otra rama en GitHub, cambia `branches:` en el YAML o alinea el VPS con `stable`.

## Secretos del repositorio (Settings → Secrets and variables → Actions)

| Secreto | Descripción |
|--------|-------------|
| `PILOT_SSH_HOST` | IP o hostname al que GitHub Actions puede llegar por SSH (p. ej. IP externa del VM, o hostname si hay DNS). **IAP no está disponible desde runners de GitHub** salvo que montes un túnel/bastión; lo habitual es SSH directo con clave o un runner self-hosted en la VPC. |
| `PILOT_SSH_USER` | Usuario SSH en el VPS (p. ej. `mauriciosobarzo`). |
| `PILOT_SSH_PRIVATE_KEY` | Clave privada PEM (contenido completo de `id_rsa` / clave dedicada para deploy). La pública debe estar en `~/.ssh/authorized_keys` del usuario en el VPS. |
| `PILOT_SSH_PORT` | (Opcional) Puerto SSH si no es 22. |

## Variables del repositorio (opcional)

| Variable | Default |
|----------|---------|
| `PILOT_DEPLOY_PATH` | `/var/www/pilot` |
| `PILOT_DEPLOY_BRANCH` | `stable` |

## Firewall / red (GCP)

Los runners de GitHub tienen IPs dinámicas. Opciones:

1. Regla de firewall que permita `tcp:22` desde un rango amplio (menos restrictivo).
2. **Self-hosted runner** en el VPS o en la misma VPC: el workflow corre ahí y no hace falta abrir SSH a internet.
3. **Bastion** con IP fija + SSH ProxyJump desde el workflow (más avanzado).

## Comprobar en el VPS

Tras el primer deploy automático:

```bash
cd /var/www/pilot && git log -1 --oneline
pm2 list
curl -s -o /dev/null -w "%{http_code}" http://localhost:5174
```

## Desactivar solo el deploy

Elimina o vacía los secretos SSH; el job `deploy` fallará en conexión. Para desactivar de forma limpia, comenta el job `deploy` en el YAML o usa una rama distinta de `stable` sin este workflow.
