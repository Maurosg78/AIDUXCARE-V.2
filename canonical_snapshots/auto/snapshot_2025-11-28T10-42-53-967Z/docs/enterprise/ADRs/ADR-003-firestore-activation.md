# ADR-003 — Firestore Backend Activation
**Date:** 2025-10-03  
**Status:** Accepted  

## Decision
Firestore replaces Supabase realtime as the active backend.

## Rationale
Simplifies compliance and data residency.

## Risks
Limited relational queries; mitigated via Supabase analytics mirror.
