#!/usr/bin/env bash
set -euo pipefail
TAG="${1:?Usage: $0 <tag>}"
LATEST_JSONL="$(ls -1t tools/eval/reports/${TAG}__*.jsonl | head -n1)"
LATEST_MD="$(ls -1t tools/eval/reports/${TAG}__*.report.md | head -n1)"
test -f "$LATEST_JSONL" && test -f "$LATEST_MD"
gh release upload "$TAG" "$LATEST_JSONL" "$LATEST_MD" --clobber
