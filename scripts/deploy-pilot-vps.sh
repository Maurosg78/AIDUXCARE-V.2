#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_ID="aiduxcare-v2-uat-dev"
readonly ZONE="us-central1-a"
readonly INSTANCE="pilot-vps"
readonly REMOTE_DIST="/var/www/pilot/dist"
readonly REMOTE_NEW_DIST="/var/www/pilot/dist-new"
readonly REMOTE_OLD_DIST="/var/www/pilot/dist-old"
readonly PM2_PROCESS="pilot-web"

if [[ ! -f "package.json" ]]; then
  echo "Run this command from the repository root." >&2
  exit 1
fi

VITE_ENABLE_ES_PILOT=true npm run build

# Prepare the candidate without modifying the build currently being served.
remoteNewCleanupCommand="rm -rf ${REMOTE_NEW_DIST:?}"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteNewCleanupCommand}"

remoteNewCreateCommand="mkdir -p ${REMOTE_NEW_DIST}"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteNewCreateCommand}"

gcloud compute scp --recurse dist/* "${INSTANCE}:${REMOTE_NEW_DIST}" --project="${PROJECT_ID}" --zone="${ZONE}"

remoteCandidateVerificationCommand="test -f ${REMOTE_NEW_DIST}/index.html"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteCandidateVerificationCommand}"

remoteOldCleanupCommand="rm -rf ${REMOTE_OLD_DIST:?}"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteOldCleanupCommand}"

# Run both renames in one remote shell and restore the active build if activation fails.
remoteSwapCommand="
set -e
mv ${REMOTE_DIST} ${REMOTE_OLD_DIST}
if ! mv ${REMOTE_NEW_DIST} ${REMOTE_DIST}
then
  mv ${REMOTE_OLD_DIST} ${REMOTE_DIST}
  exit 1
fi
"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteSwapCommand}"

remoteRestartCommand="pm2 restart ${PM2_PROCESS}"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteRestartCommand}"

remoteVerificationCommand="ls ${REMOTE_DIST}/assets/index-*.js"
gcloud compute ssh "${INSTANCE}" --project="${PROJECT_ID}" --zone="${ZONE}" --command="${remoteVerificationCommand}"
