.PHONY: docs-sec

docs-sec:
./scripts/security_doc_extractor.sh
./scripts/security_doc_extractor_supabase.sh
@TARGET="docs/architecture/section4_security_documented.md"; \
 STAMP="$$(date '+%Y-%m-%d %H:%M:%S %Z')"; \
 mkdir -p docs/architecture; \
 { \
   echo "## 4. Security (documented) — Canonicals from Repo"; \
   echo ""; \
   echo "> **Generated:** $$STAMP"; \
   echo "> **Scope:** Documenta **únicamente** controles ya implementados (sin cambios)."; \
   echo "> **DoD:** Executive Summary + ejemplos con snippets canónicos y paths + SHA."; \
   echo ""; \
   echo "---"; \
   echo "### 4.A Firestore — Rules, Indexes & CI Guardrails"; \
   sed -n '1,9999p' docs/enterprise/_generated/section4_security_documented.md 2>/dev/null || echo '_// missing Firestore doc — pending review_'; \
   echo ""; \
   echo "---"; \
   echo "### 4.B Supabase — RLS & RBAC (SQL Canonicals)"; \
   sed -n '1,9999p' docs/enterprise/_generated/section4_security_supabase.md 2>/dev/null || echo '_// missing Supabase doc — pending review_'; \
   echo ""; \
   echo "---"; \
   echo "### 4.C Gaps & Next Steps (documentation-only)"; \
   echo "- Cualquier control no detectado queda **pending review** para un PR aparte (no tocar canónicos)."; \
 } > "$$TARGET"; \
 echo "✅ Regenerado: $$TARGET"
