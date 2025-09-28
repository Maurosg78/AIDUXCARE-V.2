#!/usr/bin/env bash
set -euo pipefail

PR_META_FILE="${1:-.github/pull_request_template.md}"
if [[ -f "$PR_META_FILE" ]]; then
  PR_META="$(cat "$PR_META_FILE")"
else
  PR_META="$(printf '%s\n%s' "${PR_TITLE:-}" "${PR_BODY:-}")"
fi

echo "== Checking PR metadata =="
grep -qiE '^Market:\s*CA\b' <<<"$PR_META" || { echo "Missing 'Market: CA'"; exit 1; }
grep -qiE '^Language:\s*en-CA\b' <<<"$PR_META" || { echo "Missing 'Language: en-CA'"; exit 1; }

echo "== Checking SoT pages headers =="
shopt -s nullglob
bad=0
for f in docs/north/**/*.md docs/north/*.md; do
  awk '
    NR==1 && $0=="---" {in=1; next}
    in==1 && $0~/^Market:\s*CA$/ {m=1; next}
    in==1 && $0~/^Language:\s*en-CA$/ {l=1; next}
    in==1 && $0=="---" {in=0; next}
    (!in && $0 ~ /^#\s+/) {h1=1; exit}
    END { if(!(m && l && h1 && in==0)) exit 1 }
  ' "$f" || { echo "Invalid header: $f"; bad=1; }
done
[[ $bad -eq 0 ]] || exit 1

echo "== Checking redirects =="
need1='/README_AIDUX_NORTH /docs/north/threads/README'
need2='/README_AIDUX_NORTH.md /docs/north/threads/README.md'
grep -Fxq "$need1" docs/north/_redirects || { echo "Missing redirect: $need1"; exit 1; }
grep -Fxq "$need2" docs/north/_redirects || { echo "Missing redirect: $need2"; exit 1; }

echo "All preflight checks passed ✓"
