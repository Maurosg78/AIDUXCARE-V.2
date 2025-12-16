# Despliegue y Entornos — Aidux North

## Entornos
- **Local**: Node.js 18+, Firebase CLI configurado
- **Preview**: PRs desplegados en Vercel o GitHub Pages + Functions
- **Producción**: Firebase Hosting + Cloud Functions, Firestore (region NA-NE1)

## Pasos mínimos de despliegue
1. `npm ci`
2. Configurar variables en `.env` (no subir al repo)
3. `npm run build`
4. `firebase deploy` (hosting)  
   `firebase deploy --only functions` (solo funciones)

## Próximos pasos
- CI/CD en GitHub Actions (lint, typecheck, tests, build)
- Centralizar secretos en GitHub Secrets
- Alertas de monitoreo para uptime y costos
