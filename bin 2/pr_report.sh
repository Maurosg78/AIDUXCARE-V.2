#!/usr/bin/env bash
set -euo pipefail
REPO="${1:-Maurosg78/AIDUXCARE-V.2}"
FROM="${2:-56}"
TO="${3:-113}"
DATA="$(
  for n in $(seq "$FROM" "$TO"); do
    gh pr view "$n" -R "$REPO" \
      --json number,title,url,state,isDraft,reviewDecision,mergeable,mergeStateStatus,headRefName,baseRefName,statusCheckRollup \
      --jq '.' 2>/dev/null || true
  done
)"
jq -r -s '
  map(
    . as $p
    | ($p.statusCheckRollup // []) as $c
    | {
        number:$p.number, title:$p.title, url:$p.url, state:$p.state,
        branch:($p.headRefName+" → "+$p.baseRefName),
        isDraft:($p.isDraft//false),
        reviewDecision:($p.reviewDecision//"UNKNOWN"),
        mergeable:($p.mergeable//"UNKNOWN"),
        mergeStateStatus:($p.mergeStateStatus//"UNKNOWN"),
        failed_checks:[ $c[]? | select((.conclusion=="FAILURE") or (.state=="FAILURE") or (.state=="ERROR")) | {name,conclusion,detailsUrl}],
        pending_checks:[ $c[]? | select((.state=="PENDING") or (.conclusion==null)) | {name,state,detailsUrl}],
        blockers:(
          [
            (if ($p.isDraft//false) then "Draft" else empty end),
            (if (($p.reviewDecision//"")=="REVIEW_REQUIRED") then "Review requerida" else empty end),
            (if (($p.reviewDecision//"")=="CHANGES_REQUESTED") then "Cambios solicitados" else empty end),
            (if (($p.mergeable//"")=="CONFLICTING") then "Conflictos de merge" else empty end),
            (if ( ($c|map(select((.conclusion=="FAILURE") or (.state=="FAILURE") or (.state=="ERROR")))|length)>0 ) then "Checks fallados" else empty end),
            (if ( ($c|map(select((.state=="PENDING") or (.conclusion==null))|length)>0 ) ) then "Checks pendientes" else empty end)
          ] | unique
        )
      }
  )
  | map(select(
      (.failed_checks|length)>0 or (.pending_checks|length)>0
      or (.isDraft==true)
      or (.reviewDecision=="REVIEW_REQUIRED") or (.reviewDecision=="CHANGES_REQUESTED")
      or (.mergeable=="CONFLICTING")
    ))
  | sort_by(.number)
'
