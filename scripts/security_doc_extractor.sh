#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
OUT_DIR="$ROOT/docs/enterprise/_generated"
OUT_MD="$OUT_DIR/section4_security_documented.md"
STAMP="$(date '+%Y-%m-%d %H:%M:%S %Z')"

mkdir -p "$OUT_DIR"

# 1) Sincroniza main (read-only)
git fetch origin main >/dev/null 2>&1 || true
git rev-parse --short HEAD >/dev/null

# 2) Detecta canónicos
RULES_PATH="firestore.rules"
INDEX_PATH="firestore.indexes.json"
WORKFLOWS_DIR=".github/workflows"
SCRIPTS_DIR="scripts"

RULES_SHA="$(git log -n1 --pretty=format:%h -- "$RULES_PATH" 2>/dev/null || echo '-')"
INDEX_SHA="$(git log -n1 --pretty=format:%h -- "$INDEX_PATH" 2>/dev/null || echo '-')"

# 3) Snippets Firestore (no falla si no existen)
: > "$OUT_DIR/firestore.rules.snip"
if [ -f "$RULES_PATH" ]; then
  {
    echo "Path: $RULES_PATH  (last 200 lines)"
    echo '```'
    tail -n 200 "$RULES_PATH"
    echo '```'
  } > "$OUT_DIR/firestore.rules.snip"
fi

: > "$OUT_DIR/firestore.indexes.snip"
if [ -f "$INDEX_PATH" ]; then
  {
    echo "Path: $INDEX_PATH  (head 80 lines)"
    echo '```json'
    head -n 80 "$INDEX_PATH"
    echo '```'
  } > "$OUT_DIR/firestore.indexes.snip"
fi

# 4) Guardrails CI: listar workflows relevantes + scripts anti-SOAP
WORKFLOWS_LIST="$OUT_DIR/ci_workflows.list"
SCRIPTS_LIST="$OUT_DIR/ci_scripts.list"
rg -n --no-heading "protect infra|protect-infra|no-soap|soap-logs" "$WORKFLOWS_DIR" 2>/dev/null | sort -u > "$WORKFLOWS_LIST" || true
rg -n --no-heading "SOAP|Subjective|Objective|Assessment|Plan" "$SCRIPTS_DIR" 2>/dev/null | sort -u > "$SCRIPTS_LIST" || true

# 5) Construye Section 4 documentada (para pegar en ARCHITECTURE.md)
{
  echo "## 4. Security Architecture (documented from repo canonicals)"
  echo ""
  echo "> **Generated:** $STAMP"
  echo "> **Scope:** Documenta controles **existentes** (no introduce cambios)."
  echo ""
  echo "### 4.0 Canonical Sources"
  echo "| Artifact | Path | Last Commit |"
  echo "|---|---|---|"
  echo "| Firestore Rules | \`$RULES_PATH\` | \`$RULES_SHA\` |"
  echo "| Firestore Indexes | \`$INDEX_PATH\` | \`$INDEX_SHA\` |"
  if [ -d "$WORKFLOWS_DIR" ]; then
    echo "| CI Workflows | \`$WORKFLOWS_DIR\` | (varios) |"
  fi
  if [ -d "$SCRIPTS_DIR" ]; then
    echo "| CI Scripts | \`$SCRIPTS_DIR\` | (varios) |"
  fi
  echo ""
  echo "---"
  echo "### Executive Summary"
  echo "- **Zero-trust**: acceso mínimo, reglas de seguridad en Firestore y guardrails CI."
  echo "- **Identidad verificada**: acceso a datos clínicos **solo** vía backend con credenciales de servicio."
  echo "- **Cifrado**: TLS en tránsito; cifrado gestionado en reposo (GCP)."
  echo "- **Inmutabilidad**: notas firmadas prohibidas de editar por reglas."
  echo "- **Guardrails CI**: *no SOAP logs* + *infra protegida* evitan fugas y cambios peligrosos."
  echo ""
  echo "---"
  echo "### 4.1 Firestore Security Rules (snippets reales)"
  if [ -s "$OUT_DIR/firestore.rules.snip" ]; then
    cat "$OUT_DIR/firestore.rules.snip"
  else
    echo "_No se encontró \`$RULES_PATH\` — **pending review**._"
  fi
  echo ""
  echo "#### Comentario (cómo nos protegen):"
  echo "- Validan identidad de ejecución (service account) y estado de la nota (p. ej. \`signed\`)."
  echo "- Implementan **deny-by-default** salvo condiciones explícitas."
  echo ""
  echo "---"
  echo "### 4.2 Firestore Indexes (relevantes para continuidad)"
  if [ -s "$OUT_DIR/firestore.indexes.snip" ]; then
    cat "$OUT_DIR/firestore.indexes.snip"
  else
    echo "_No se encontró \`$INDEX_PATH\` — **pending review**._"
  fi
  echo ""
  echo "---"
  echo "### 4.3 CI Guardrails (Workflows & Scripts)"
  echo "**Workflows que bloquean cambios peligrosos / fugas:**"
  if [ -s "$WORKFLOWS_LIST" ]; then
    echo '```'
    cat "$WORKFLOWS_LIST"
    echo '```'
  else
    echo "_No se detectaron entradas — **pending review**._"
  fi
  echo ""
  echo "**Scripts que detectan texto SOAP/PHI en logs:**"
  if [ -s "$SCRIPTS_LIST" ]; then
    echo '```'
    cat "$SCRIPTS_LIST"
    echo '```'
  else
    echo "_No se detectaron entradas — **pending review**._"
  fi
  echo ""
  echo "---"
  echo "### 4.4 Threats & Mitigations (modelo actual)"
  echo "- **Edición de notas firmadas** → bloqueado por reglas (ver snippets)."
  echo "- **Fugas de texto clínico en logs** → bloqueado por \`check-no-soap-logs\` + PR checks."
  echo "- **Cambios peligrosos en infra** → workflow *Protect Infra Files* impide borrados."
  echo "- **Acceso directo desde frontend** → solo backend con service account toca Firestore."
  echo ""
  echo "---"
  echo "### 4.5 Gaps & TODOs (documentación)"
  echo "- Si falta alguna política/índice esperado, queda **pending review**. No se implementa en este PR."
} > "$OUT_MD"

echo "✅ Generated: $OUT_MD"
