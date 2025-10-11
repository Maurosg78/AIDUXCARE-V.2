#!/usr/bin/env bash
set -euo pipefail
out="tools/eval/reports/$(date -u +%Y%m%dT%H%M%SZ).jsonl"
echo '{"event":"eval-start","ts":"'$(date -u +%FT%TZ)'"}' >> "$out"
echo "Wrote $out"
