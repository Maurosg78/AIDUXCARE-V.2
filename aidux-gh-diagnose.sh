#!/usr/bin/env bash
set -euo pipefail

echo "▶ GitHub CLI version"
if command -v gh >/dev/null 2>&1; then
  gh --version
else
  echo "gh no está instalado. Instálalo con: brew install gh (macOS) o ver https://cli.github.com/"
  exit 1
fi
echo

echo "▶ Estado de autenticación"
gh auth status || true
echo

echo "▶ Remoto origin"
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
if [ -z "$ORIGIN_URL" ]; then
  echo "No se encontró remoto 'origin'. ¿Estás dentro del repo?"
  exit 1
fi
echo "$ORIGIN_URL"
echo

echo "▶ Detección owner/repo"
# Soporta SSH y HTTPS
if [[ "$ORIGIN_URL" =~ github.com[:/](.+)/(.+)\.git ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "No pude parsear owner/repo desde: $ORIGIN_URL"
  exit 1
fi
echo "OWNER=$OWNER REPO=$REPO"
echo

echo "▶ Acceso al repo (gh repo view)"
gh repo view "$OWNER/$REPO" --json name,visibility,defaultBranchRef,viewerPermission -q \
  '. as $r | "name=\($r.name) visibility=\($r.visibility) defaultBranch=\($r.defaultBranchRef.name) perm=\($r.viewerPermission)"' || true
echo

echo "▶ Rama actual y ramas remotas relevantes"
git branch --show-current || true
git fetch --all --quiet || true
git branch -r | grep -E "origin/(main|demo/niagara-2025-09)" || echo "No existe todavía la rama remota demo/niagara-2025-09"
echo

echo "▶ Workflows disponibles"
gh workflow list || true
echo

echo "▶ Últimas ejecuciones del workflow 'Quality' (si existe)"
if gh workflow view Quality >/dev/null 2>&1; then
  gh run list --workflow=Quality --limit 5 || true
else
  echo "Workflow 'Quality' no encontrado."
fi
echo

echo "▶ Protección de rama (main)"
gh api -X GET "repos/$OWNER/$REPO/branches/main/protection" --silent \
  | jq -r '. | "required_status_checks=\(.required_status_checks) enforce_admins=\(.enforce_admins) required_pull_request_reviews=\(.required_pull_request_reviews)"' 2>/dev/null \
  || echo "No pude leer protección de main (requiere permisos repo admin o la rama no está protegida)."
echo

echo "▶ Protección de rama (demo/niagara-2025-09)"
gh api -X GET "repos/$OWNER/$REPO/branches/demo/niagara-2025-09/protection" --silent \
  | jq -r '. | "required_status_checks=\(.required_status_checks) enforce_admins=\(.enforce_admins) required_pull_request_reviews=\(.required_pull_request_reviews)"' 2>/dev/null \
  || echo "No pude leer protección de la rama demo (quizá no existe o faltan permisos)."
echo

echo "▶ Secretos de Actions (repo-level)"
gh secret list || echo "No se pudieron listar secretos (revisa permisos)."
echo

echo "✅ Diagnóstico terminado."
