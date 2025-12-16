## Multi-tag Validation  Resultados

tag | run_id | createdAt | conclusion
--- | --- | --- | ---
qa-eval-gate-20251013T124710Z | 18467991792 | 2025-10-13T13:50:34Z | success
qa-eval-gate-20251012T205920Z | 18468018339 | 2025-10-13T13:51:32Z | success
qa-eval-gate-20251012T130715Z | 18468042936 | 2025-10-13T13:52:23Z | success
]633;E;{ echo\x3b echo "**Assets en releases:**"\x3b for TAG in $TAGS\x3b do URLS=$(gh api /repos/$REPO/releases/tags/$TAG --jq '.assets[].browser_download_url' 2>/dev/null | paste -sd "," -)\x3b [[ -z "$URLS" ]] && echo "- $TAG: sin assets" || echo "- $TAG: $URLS"\x3b done\x3b echo\x3b echo "**Incidencias:**"\x3b [[ -s incidencias.txt ]] && cat incidencias.txt || echo "ninguna"\x3b } >> validation-results.md;ee8cbc9e-5160-411d-9c36-7ab6d9fde8ab]633;C
]633;E;{   echo\x3b echo "**Assets en releases:**"\x3b   for TAG in $TAGS\x3b do     URLS=$(gh release view -R "$REPO" "$TAG" --json assets --jq '.assets[].downloadUrl' 2>/dev/null | paste -sd "," -)\x3b     [[ -z "$URLS" ]] && echo "- $TAG: sin assets" || echo "- $TAG: $URLS"\x3b   done\x3b   echo\x3b echo "**Incidencias:**"\x3b   [[ -s incidencias.txt ]] && cat incidencias.txt || echo "ninguna"\x3b } >> validation-results.md;90bdd4b1-63f2-492e-97f6-44f78a2f751b]633;C
]633;E;{   echo\x3b echo "**Assets en releases:**"\x3b   for TAG in $TAGS\x3b do     URLS=$(gh release view -R "$REPO" "$TAG" --json assets --jq '.assets[].browserDownloadUrl' 2>/dev/null | paste -sd "," -)\x3b     [[ -z "$URLS" ]] && echo "- $TAG: sin assets" || echo "- $TAG: $URLS"\x3b   done\x3b   echo\x3b echo "**Incidencias:**"\x3b   [[ -s incidencias.txt ]] && cat incidencias.txt || echo "ninguna"\x3b } >> validation-results.md;f30e1d15-1d46-490b-a212-569c08759af4]633;C

**Assets en releases:**

**Incidencias:**
ninguna
