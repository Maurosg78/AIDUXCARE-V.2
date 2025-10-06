# ADR-001 — Firestore as Core Backend
**Date:** 2025-10-06  
**Status:** Accepted  
**Context:** Supabase used for analytics only; Firestore preferred for realtime sync and compliance locks.  
**Decision:** Maintain Firestore as canonical data store for all clinical data.  
**Consequences:** Tight integration with Firebase Auth, simplified PHIPA enforcement.
