# Sign Note UI + Modal

## Goal
Confirmation modal with SOAP preview and validation before signing.

## QA Steps
1. Open a submitted note.
2. Click **Sign Note** → modal appears (focus on Cancel).
3. Keyboard: `Esc` closes; `Tab` cycles within dialog.
4. If SOAP invalid → **Sign note** disabled with clear message.
5. On confirm → calls `PUT /notes/:id/sign` and shows success toast.

## A11y
- `role="dialog"`, `aria-labelledby`
- Focus management on open/close
- Escape to dismiss

Market: CA  
Language: en-CA  
COMPLIANCE_CHECKED  
Signed-off-by: ROADMAP_READ
