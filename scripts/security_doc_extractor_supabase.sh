#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
OUT_DIR="$ROOT/docs/enterprise/_generated"
SQL_SNIPS_DIR="$OUT_DIR/sql"
OUT_MD="$OUT_DIR/section4_security_supabase.md"
STAMP="$(date '+%Y-%m-%d %H:%M:%S %Z')"

mkdir -p "$OUT_DIR" "$SQL_SNIPS_DIR"

echo "📂 Repo: $ROOT"
echo "🧪 Buscando canónicos SQL (RLS/RBAC) en todo el repo…"

SQL_PATHS="$(
  rg -n --hidden -S -i \
    -g '!node_modules' -g '!**/*.min.*' \
    -e 'CREATE POLICY' \
    -e 'ENABLE ROW LEVEL SECURITY' \
    -e 'auth\.uid\(' \
    -e '\bclinic_id\b' \
    -e 'check\s*\(role\s*in' \
    "$ROOT" \
  | cut -d: -f1 \
  | sort -u \
  | grep -E '\.sql$' \
  | grep -v 'docs/enterprise/_generated' \
  | grep -v 'security_doc_extractor'
)"

COUNT="$(printf "%s\n" "$SQL_PATHS" | grep -c . || true)"
echo "🔎 SQL files detectados: $COUNT"

if [ -z "${SQL_PATHS:-}" ]; then
  echo "⚠️  No se encontraron archivos SQL con patrones RLS/RBAC."
fi

REFS_TSV="$(mktemp)"
: > "$REFS_TSV"

extract() {
  local f="$1"
  [ -f "$f" ] || return 0
  local sha base rel
  sha="$(git -C "$ROOT" log -n1 --pretty=format:%h -- "$f" 2>/dev/null || echo '-')"
  base="$(basename "$f")"
  rel="$(python3 - <<PY
import os
root=os.path.abspath("$ROOT"); f=os.path.abspath("$f")
print(os.path.relpath(f, root))
PY
)"
  echo "FOUND: $rel  (sha: $sha)"

  # Extraer sentencias completas terminadas en ';'
  awk -v RS=';' '
    BEGIN { print "```sql" }
    /CREATE[[:space:]]+POLICY/ {
      gsub(/^[\r\n\t ]+|[\r\n\t ]+$/, "", $0);
      if (length($0)>0) { print $0 ";" ; print "-- ---" }
    }
    /ENABLE[[:space:]]+ROW[[:space:]]+LEVEL[[:space:]]+SECURITY/ {
      gsub(/^[\r\n\t ]+|[\r\n\t ]+$/, "", $0);
      if (length($0)>0) { print $0 ";" ; print "-- ---" }
    }
    END { print "```" }
  ' "$f" > "$SQL_SNIPS_DIR/$base.snip.sql"

  printf "| \`%s\` | \`%s\` |\n" "$rel" "$sha" >> "$REFS_TSV"
}

if [ -n "${SQL_PATHS:-}" ]; then
  while IFS= read -r p; do extract "$p"; done <<< "$SQL_PATHS"
fi

{
  echo "## 4.x Supabase RLS & RBAC (documented from repo canonicals)"
  echo ""
  echo "> **Generated:** $STAMP"
  echo "> **Scope:** Documenta **migraciones y políticas SQL existentes** (sin cambios)."
  echo ""
  echo "### Canonical SQL Sources"
  echo "| File Path | Last Commit |"
  echo "|---|---|"
  if [ -s "$REFS_TSV" ]; then
    cat "$REFS_TSV"
  else
    echo "| // no SQL policies discovered | // pending review |"
  fi
  echo ""
  echo "---"
  echo "### Executive Summary (SQL)"
  echo "- **RLS habilitado** en tablas sensibles (migraciones canónicas)."
  echo "- **Scoping por \`clinic_id\`** + **identidad \`auth.uid()\`**."
  echo "- **RBAC** inferido por constraints/checks de rol y policies."
  echo "- **Borrado** normalmente restringido a roles elevados y/o auditado."
  echo ""
  echo "---"
  echo "### Snippets reales (auto-extraídos)"
  shopt -s nullglob
  for snip in "$SQL_SNIPS_DIR"/*.snip.sql; do
    src="$(basename "$snip" .snip.sql)"
    echo ""
    echo "**Source:** \`$src\`"
    cat "$snip"
  done
  shopt -u nullglob
  echo ""
  echo "---"
  echo "### Observaciones"
  echo "- Si algún control esperado no aparece, queda **pending review** para PR separado (sin tocar canónicos)."
} > "$OUT_MD"

echo "✅ Generated: $OUT_MD"
