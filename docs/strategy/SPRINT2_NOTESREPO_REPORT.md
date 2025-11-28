# Sprint 2 – Notes Persistence (Firestore) – CTO Report

Date: 3 Oct 2025
Owner: Hilo Programación Técnica
Status: ✅ DoD Achieved

## Scope Delivered
- Firestore chosen as production backend for notes.
- notesRepo.ts CRUD + guardrails (immutability on signed notes).
- Feature flag: AIDUX_PROGRESS_NOTES (env: VITE_FEATURE_PROGRESS_NOTES).
- Firestore security rules and composite index.
- Emulator-based unit tests covering happy paths and edge cases.

## Key Artifacts
- Types & errors: src/types/notes.ts (ClinicalNote, NoteError)
- Repo: src/repositories/notesRepo.ts
- Flag helper: src/flags.ts
- Rules: firestore.rules
- Indexes: firestore.indexes.json
- Tests: test/persistence/notesRepo.spec.ts
- Env example: .env.example (adds VITE_FEATURE_PROGRESS_NOTES=false)

## How to Verify Locally
Run: firebase emulators:exec --only firestore,auth --project demo-notesrepo "pnpm run test:persistence"
Expected: 4 passed (vitest)

## Security Rules Summary
- Read: authenticated users.
- Create: only owner (clinicianUid == auth.uid), status in [draft, submitted].
- Update: only owner; signed notes immutable; signing update cannot modify SOAP fields.
- Delete: not allowed.

## DoD Checklist
- [x] Firestore index created and verified
- [x] Security rules implemented (tested on emulator)
- [x] notesRepo implements createNote, updateNote, getNoteById, getLastNoteByPatient, getLastNotes
- [x] Error code enum implemented
- [x] Unit tests for happy path and edge cases
- [x] Feature flag integrated (AIDUX_PROGRESS_NOTES)
- [x] No SOAP content in logs (policy documented)

## Notes
- Production deploy of rules/indexes will be done via CI with firebase.json targets.
- Supabase migration deferred; adapter pattern documented for future sprints.

Market: CA | Language: en-CA
