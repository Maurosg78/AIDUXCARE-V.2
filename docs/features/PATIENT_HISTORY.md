# Patient History View

## Overview
The Patient History View feature allows healthcare professionals to review all clinical notes for a specific patient in chronological order.

## Features
- Chronological note list (most recent first)
- Status filtering (draft/submitted/signed/all)
- Search within note content (SOAP fields)
- Detailed note view (read-only)
- Note signing from history view
- Responsive split-panel design

## Usage
Navigate to `/patient-history/:patientId`

## Components
- `PatientHistoryPage`: Main page with routing
- `NoteHistoryList`: Note cards with loading states  
- `NoteHistoryCard`: Individual note preview
- `NoteHistoryFilters`: Status and search controls
- `NoteDetailView`: Full SOAP display
- `usePatientHistory`: Hook for data and filtering

## Testing
Basic tests included in test/ directory. Manual testing at `/patient-history/patient-1`.

## Integration
Reuses existing: NoteStatusBadge, SignNoteButton, Button components.
Uses mock API (ready for real API switch).
