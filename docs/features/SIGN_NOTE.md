# Sign Note Feature

## Overview

The Sign Note feature allows healthcare professionals to digitally sign clinical notes, making them legally valid and immutable according to PHIPA requirements.

## Components

### 1. useSignNote Hook

**Location:** `src/hooks/useSignNote.ts`

**Purpose:** Manages the signing logic, loading states, and error handling.

**Usage:**
```typescript
import { useSignNote } from '@/hooks/useSignNote';

const { signNote, isLoading, error, clearError } = useSignNote();

// Sign a note
await signNote(noteId);
```

### 2. SignNoteButton

**Location:** `src/components/notes/SignNoteButton.tsx`

**Purpose:** Button that triggers the signing flow. Only visible for submitted notes.

**Usage:**
```typescript
<SignNoteButton
  noteId={note.id}
  status={note.status}
  onClick={() => setModalOpen(true)}
  disabled={isLoading}
/>
```

### 3. SignNoteModal

**Location:** `src/components/notes/SignNoteModal.tsx`

**Purpose:** Confirmation dialog showing SOAP preview and warnings.

**Features:**
- SOAP validation (all fields required)
- Irreversible action warning
- Patient and date display
- Loading states
- Error handling

**Usage:**
```typescript
<SignNoteModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onConfirm={handleSign}
  note={noteData}
  isLoading={isLoading}
/>
```

### 4. NoteStatusBadge

**Location:** `src/components/notes/NoteStatusBadge.tsx`

**Purpose:** Visual indicator of note status with tooltips.

**Statuses:**
- **Draft** (gray): Note in progress
- **Ready to Sign** (yellow): Submitted, awaiting signature
- **Signed** (green): Signed and immutable

## User Flow

1. User completes SOAP note → Status: Draft
2. User submits note → Status: Submitted
3. "Sign Note" button appears
4. User clicks "Sign Note"
5. Modal shows SOAP preview + warning
6. User confirms signature
7. Note is signed → Status: Signed
8. Note becomes read-only

## Technical Details

### API Integration

Currently uses mock API (`src/api/__mocks__/notes.ts`).

To switch to real API:
```typescript
// In src/hooks/useSignNote.ts
// Change this:
import { signNote as signNoteAPI } from '@/api/__mocks__/notes';

// To this:
import { signNote as signNoteAPI } from '@/api/notes';
```

### Backend Endpoint
```
PUT /notes/:id/sign

Response:
{
  success: true,
  note: {
    id: string,
    status: 'signed',
    signedAt: string (ISO),
    immutable_hash: string,
    immutable_signed: true
  }
}
```

### Validation Rules

1. All SOAP fields must be non-empty
2. Note status must be 'submitted'
3. User must have permission to sign
4. Once signed, note cannot be unsigned

### Security

- Signature creates immutable hash (backend)
- Signed notes are read-only (UI enforced)
- PHIPA compliant data handling

## Testing

Run tests:
```bash
npm test src/hooks/__tests__/useSignNote.spec.ts
```

Coverage: 6 test cases
- Initialization
- Loading states
- Success handling
- Error handling
- Error clearing
- Validation

## Accessibility

- ARIA labels on buttons
- Dialog role on modal
- Focus trap in modal
- Keyboard navigation (Tab, Esc)
- Screen reader friendly

## Future Enhancements

- [ ] Signature pad for handwritten signatures
- [ ] Co-signing by multiple providers
- [ ] Email notification on signature
- [ ] Audit trail visualization
- [ ] Batch signing multiple notes

## Market & Compliance

- **Market:** Canada (CA)
- **Language:** English Canadian (en-CA)
- **Compliance:** PHIPA, PIPEDA
- **Date Format:** en-CA locale

---

**Last Updated:** October 17, 2025  
**Status:** Production Ready  
**Author:** CTO / Development Team
