#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-Maurosg78/AIDUXCARE-V.2}"
BRANCH="${2:-main}"
CTX="${3:-build}"

TMP="$(mktemp)"
cat > "$TMP" <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["${CTX}"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON

echo ">> Update protection for ${REPO}@${BRANCH} (ctx=${CTX})"
gh api -X PUT -H "Accept: application/vnd.github+json" \
  "repos/${REPO}/branches/${BRANCH}/protection" --input "$TMP" >/dev/null

echo ">> Snapshot"
gh api -H "Accept: application/vnd.github+json" \
  "repos/${REPO}/branches/${BRANCH}/protection" \
  --jq "{admins: .enforce_admins.enabled, strict: .required_status_checks.strict, contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews.required_approving_review_count, requiresConversationResolution: .required_conversation_resolution.enabled, allowForcePushes: .allow_force_pushes.enabled, allowDeletions: .allow_deletions.enabled}"
