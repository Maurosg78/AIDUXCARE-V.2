# ADR-006 — Indexing Strategy for Notes Continuity
**Date:** 2025-10-06  
**Status:** Accepted

## Context
Queries must fetch the latest patient notes efficiently and deterministically.

## Decision
Composite index for `notes`:
- `patientId` ASC
- `status` ASC
- `createdAt` DESC

## Consequences
- Deterministic "latest" retrieval.
- Stable pagination.

## Example Queries (TS pseudo)
```ts
// getLastNoteByPatient(patientId)
where('patientId','==',pid).where('status','in',['submitted','signed'])
.orderBy('patientId').orderBy('status').orderBy('createdAt','desc')
.limit(1)

// getLastNotes(patientId, count)
where('patientId','==',pid).where('status','in',['submitted','signed'])
.orderBy('patientId').orderBy('status').orderBy('createdAt','desc')
.limit(count)
