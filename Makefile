protect:restore:
\t./scripts/repo/protection-restore.sh Maurosg78/AIDUXCARE-V.2 main build

protect:snapshot:
\tgh api -H "Accept: application/vnd.github+json" \
\t  repos/Maurosg78/AIDUXCARE-V.2/branches/main/protection \
\t  --jq "{admins: .enforce_admins.enabled, strict: .required_status_checks.strict, contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews.required_approving_review_count, requiresConversationResolution: .required_conversation_resolution.enabled, allowForcePushes: .allow_force_pushes.enabled, allowDeletions: .allow_deletions.enabled}"
