#!/usr/bin/env bash
set -euo pipefail

# ===== Config =====
REPO="${REPO:-Maurosg78/AIDUXCARE-V.2}"
LABELS=(
  "Hilo: Sprint Organization"
  "Hilo: Technical Programming"
  "Hilo: Investor Materials"
  "Hilo: Regulatory-to-Code"
  "Hilo: Shared Resources"
  "Hilo: Business Plan"
  "Hilo: Data & Validation"
)

mk_body() {
  local LABEL="$1"
  cat <<EOF
Market: CA
Language: en-CA

This is the daily control thread for ${LABEL}.
Post the daily update using the template below:

**Yesterday:**
**Today:**
**Risks/Blockers:**
**Links/PRs:**
EOF
}

title_for_label() {
  case "$1" in
    "Hilo: Sprint Organization")    echo "[Thread] Sprint Organization — Daily Control" ;;
    "Hilo: Technical Programming")  echo "[Thread] Technical Programming — Daily Control" ;;
    "Hilo: Investor Materials")     echo "[Thread] Investor Materials — Daily Control" ;;
    "Hilo: Regulatory-to-Code")     echo "[Thread] Regulatory-to-Code — Daily Control" ;;
    "Hilo: Shared Resources")       echo "[Thread] Shared Resources — Daily Control" ;;
    "Hilo: Business Plan")          echo "[Thread] Business Plan — Daily Control" ;;
    "Hilo: Data & Validation")      echo "[Thread] Data & Validation — Daily Control" ;;
    *) echo ""; return 1 ;;
  esac
}

# ===== Subcmd: ensure =====
cmd_ensure() {
  # Crear labels (idempotente)
  for L in "${LABELS[@]}"; do
    gh label create "$L" -R "$REPO" --color BFD4F2 --description "$L owner thread" 2>/dev/null || true
  done

  # Crear issues de control si faltan
  for L in "${LABELS[@]}"; do
    local ID
    ID="$(gh issue list -R "$REPO" --label "$L" --search "Daily Control in:title" \
          --state all --limit 1 --json number --jq '.[0]?.number' 2>/dev/null || true)"
    if [ -z "${ID:-}" ] || [ "${ID}" = "null" ]; then
      local TITLE; TITLE="$(title_for_label "$L")"
      local URL
      URL="$(gh issue create -R "$REPO" --title "$TITLE" --label "$L" --body "$(mk_body "$L")" 2>/dev/null)"
      echo "Created: $URL"
    fi
  done
  echo "✅ ensure: labels e issues de control listos."
}

# ===== Subcmd: daily =====
# Uso: daily "<Label exacto>" "<texto con saltos de línea permitidos>"
cmd_daily() {
  if [ $# -lt 2 ]; then
    echo "Uso: $0 daily \"<Hilo: …>\" \"<texto>\"" >&2; exit 1
  fi
  local LABEL="$1"; shift
  local TEXT="$1"

  # Buscar issue abierto
  local ID
  ID="$(gh issue list -R "$REPO" --label "$LABEL" --search "Daily Control in:title" \
        --state open --limit 1 --json number --jq '.[0]?.number' 2>/dev/null || true)"

  # Si no hay abierto, tomar el más reciente por updatedAt (cualquier estado)
  if [ -z "${ID:-}" ] || [ "${ID}" = "null" ]; then
    ID="$(gh issue list -R "$REPO" --label "$LABEL" --search "Daily Control in:title" \
          --state all --limit 50 --json number,updatedAt \
          --jq 'sort_by(.updatedAt) | .[-1]?.number' 2>/dev/null || true)"
  fi

  # Si no existe, créalo
  if [ -z "${ID:-}" ] || [ "${ID}" = "null" ]; then
    local TITLE; TITLE="$(title_for_label "$LABEL")"
    if [ -z "$TITLE" ]; then echo "❌ Label desconocido: $LABEL" >&2; exit 1; fi
    local URL
    URL="$(gh issue create -R "$REPO" --title "$TITLE" --label "$LABEL" --body "$(mk_body "$LABEL")" 2>/dev/null)"
    ID="$(printf "%s\n" "$URL" | sed -n 's#.*/issues/\([0-9][0-9]*\).*#\1#p')"
  fi

  if [ -z "${ID:-}" ] || [ "${ID}" = "null" ]; then
    echo "❌ No se pudo resolver el Issue para $LABEL" >&2; exit 1
  fi

  gh issue comment "$ID" -R "$REPO" --body "$TEXT" >/dev/null
  echo "✅ Daily publicado en issue #$ID ($LABEL)"
}

# ===== Subcmd: review =====
cmd_review() {
  for L in "${LABELS[@]}"; do
    echo; echo "========== $L =========="
    gh issue list -R "$REPO" --label "$L" --state open --limit 10 \
      --json number,title,updatedAt,url \
      --jq '.[] | "- #" + ( .number|tostring ) + " " + .title + " — " + .url + " (updated " + .updatedAt + ")"' 2>/dev/null || true
    local ID
    ID="$(gh issue list -R "$REPO" --label "$L" --search "Daily Control in:title" \
          --state open --limit 1 --json number --jq '.[0]?.number' 2>/dev/null || true)"
    if [ -n "${ID:-}" ] && [ "$ID" != "null" ]; then
      echo "• Último comentario en #$ID:"
      gh issue view "$ID" -R "$REPO" --comments --limit 1 2>/dev/null | sed 's/^/    /' || true
    fi
  done
}

# ===== Help =====
cmd_help() {
  cat <<EOF
Uso: $0 <subcomando> [args]

Subcomandos:
  ensure                Crea labels y issues de control si faltan.
  daily "<Label>" "<Texto>"  Publica un parte diario en el issue del hilo.
  review                Lista issues por hilo y muestra el último comentario del control.

Ejemplos:
  REPO="$REPO" $0 ensure
  $0 daily "Hilo: Sprint Organization" $'**Yesterday:** ...\n**Today:** ...\n**Risks/Blockers:** ...\n**Links/PRs:** ...'
  $0 review
EOF
}

# ===== Dispatch =====
SUB="${1:-help}"; shift || true
case "$SUB" in
  ensure) cmd_ensure "$@";;
  daily)  cmd_daily "$@";;
  review) cmd_review "$@";;
  help|--help|-h) cmd_help;;
  *) echo "Subcomando desconocido: $SUB" >&2; cmd_help; exit 1;;
esac
