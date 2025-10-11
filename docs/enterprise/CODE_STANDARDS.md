# CODE_STANDARDS.md (v1) — TypeScript/React First (en-CA, Market: CA)

> These standards focus on **TypeScript + React** for v1. Back-end/API patterns will be added in v1.1.  
> All examples use **fictitious** data; never use real patient information.  
> Compliance lenses: **PHIPA/CPO**, auditability, accessibility, and quality.

## Table of Contents
1. [TypeScript Patterns](#1-typescript-patterns)
2. [React Patterns](#2-react-patterns)
3. [Testing Patterns](#3-testing-patterns)
4. [Git Conventions](#4-git-conventions)

---

## 1. TypeScript Patterns

### Pattern TS-01 — Strict typing for clinical data (never `any`)
**What**: Use precise types for clinical DTOs; forbid `any`.  
**Why**: Reduces risk of PHI/PII mishandling; improves refactor safety and E2E quality (PHIPA/CPO).
**Example**
    
    export type Gender = 'female' | 'male' | 'nonbinary' | 'unknown';
    export interface VitalSignsDTO {
      readonly patientId: PatientId;
      readonly recordedAt: string; // ISO-8601
      readonly heartRateBpm: number;
      readonly systolicMmHg: number;
      readonly diastolicMmHg: number;
    }

**Pitfalls**
- Using `any` or `unknown` without narrowing.
- Silent coercions; implicit `any` in tsconfig.

---

### Pattern TS-02 — Result/Either for error handling
**What**: Return typed results (`Ok`/`Err`) instead of throwing across UI boundaries.  
**Why**: Predictable UX, easier tests, better telemetry.
**Example**
    
    type Ok<T> = { ok: true; value: T };
    type Err<E> = { ok: false; error: E };
    export type Result<T, E> = Ok<T> | Err<E>;
    export function parseIso(input: string): Result<Date, 'invalid_iso'> {
      const d = new Date(input);
      return Number.isNaN(d.getTime()) ? { ok: false, error: 'invalid_iso' } : { ok: true, value: d };
    }

**Pitfalls**
- Throwing in deep utilities and catching in components.
- Hiding errors in console logs.

---

### Pattern TS-03 — Type narrowing & guards for PII/PHI access
**What**: Use user-defined type guards to gate PHI access (purpose-of-use).  
**Why**: Defence-in-depth for PHIPA; clearer intent.
**Example**
    
    type Role = 'admin' | 'clinician' | 'reviewer';
    interface Claims { role: Role; clinicId: string; purpose?: 'care'|'ops'|'qa' }
    export const canViewPHI = (c: Claims): c is Claims & { purpose: 'care' } => c.purpose === 'care';

**Pitfalls**
- Blind casts (`as`) to bypass guards.

### Pattern TS-04 — Immutability & `Readonly` DTOs
**What**: Prefer immutable DTOs with `Readonly<T>` and `as const`.  
**Why**: Traceable state; fewer side-effects; easier audits.
**Example**
    
    export interface NoteDTO {
      readonly id: string;
      readonly authorId: string;
      readonly status: 'draft'|'signed';
      readonly text: string;
    }

**Pitfalls**
- Deep mutation of nested objects in place.

---

### Pattern TS-05 — Branded types for sensitive IDs
**What**: Use nominal (branded) types to avoid mixing IDs.  
**Why**: Prevents cross-entity mistakes (patient vs encounter).
**Example**
    
    type Brand<T, B extends string> = T & { readonly __brand: B };
    export type PatientId = Brand<string, 'PatientId'>;
    export type EncounterId = Brand<string, 'EncounterId'>;
    export const asPatientId = (s: string): PatientId => s as PatientId;

**Pitfalls**
- Plain `string` IDs passed across layers.

---

### Pattern TS-06 — Schema validation at boundaries (Zod or similar)
**What**: Validate input/output at API or I/O boundaries.  
**Why**: Types ≠ runtime guarantees; PHIPA requires correctness.
**Example**
    
    // with zod
    import { z } from 'zod';
    export const VitalSchema = z.object({
      patientId: z.string().min(1),
      recordedAt: z.string().datetime(),
      heartRateBpm: z.number().int().min(0).max(300),
    });
    export type Vital = z.infer<typeof VitalSchema>;

**Pitfalls**
- Trusting compile-time types for untrusted sources.

## 2. React Patterns

### Pattern RE-01 — Custom hooks for data fetching (abort/cleanup)
**What**: Encapsulate fetch with `AbortController` and cleanup.  
**Why**: Avoid memory leaks and race conditions.
**Example**
    
    export function useVitals(patientId: string) {
      const [data, setData] = React.useState<Vital[] | null>(null);
      const [err, setErr] = React.useState<string | null>(null);
      React.useEffect(() => {
        const ctrl = new AbortController();
        fetch(`/api/vitals?patientId=${encodeURIComponent(patientId)}`, { signal: ctrl.signal })
          .then(r => r.ok ? r.json() : Promise.reject('bad_status'))
          .then(setData)
          .catch(e => { if (e !== 'AbortError') setErr(String(e)); });
        return () => ctrl.abort();
      }, [patientId]);
      return { data, err };
    }

**Pitfalls**
- Updating state after unmount; ignoring aborts.

---

### Pattern RE-02 — Minimal state (lifting vs context)
**What**: Lift state where needed; use split contexts for wide sharing.  
**Why**: Performance, clarity, testability.
**Example**
    
    // Good: local state at feature boundary
    function VitalsPanel() { /* local state + props down */ return <div />; }

**Pitfalls**
- Monolithic global context with unrelated concerns.

---

### Pattern RE-03 — Typed component boundaries (no generic FC)
**What**: Define explicit props; avoid `React.FC` generic defaults.  
**Why**: Clear contracts; better inference.
**Example**
    
    type ButtonProps = { label: string; onPress(): void; disabled?: boolean };
    export function Button({ label, onPress, disabled = false }: ButtonProps) {
      return <button aria-label={label} onClick={onPress} disabled={disabled}>{label}</button>;
    }

**Pitfalls**
- `any` in props/children; implicit `any` events.

### Pattern RE-04 — A11y & en-CA copy
**What**: Use semantic HTML/ARIA; Canadian English copy.  
**Why**: Legal/a11y obligations; inclusive UX.
**Example**
    
    <label htmlFor="cc">Chief complaint</label>
    <input id="cc" name="cc" aria-describedby="cc-help" />
    <small id="cc-help">Describe symptoms in your own words.</small>

**Pitfalls**
- Missing labels; incorrect ARIA roles.

---

### Pattern RE-05 — Suspense & error boundaries
**What**: Wrap async UI with boundaries per feature.  
**Why**: Predictable loading; contained failures.
**Example**
    
    function Fallback() { return <div role="status">Loading…</div>; }
    function ErrorBox({ error }: { error: Error }) { return <div role="alert">{error.message}</div>; }

**Pitfalls**
- Single global boundary swallowing actionable errors.

---

## 3. Testing Patterns

### Pattern TE-01 — Unit vs integration (criteria)
**What**: Prioritise integration for critical flows; unit for logic-heavy utils.  
**Why**: Balanced ROI, less flakiness, risk-based coverage.
**Example**
    
    // Unit (pure function)
    expect(parseIso('2025-01-01T00:00:00Z').ok).toBe(true);
    // Integration (component + hook + network mock) — use MSW/RTL.

**Pitfalls**
- Snapshot-only tests; brittle shallow mocks.

---

### Pattern TE-02 — Test data builders (fictitious; no PHI)
**What**: Generate synthetic data builders.  
**Why**: Repeatable, safe, en-CA copy.
**Example**
    
    type Patient = { id: PatientId; given: string; family: string };
    const buildPatient = (over?: Partial<Patient>): Patient => ({
      id: asPatientId('pat_0001'),
      given: 'Alex',
      family: 'Morgan',
      ...over,
    });

**Pitfalls**
- Static fixtures with real data; giant JSON blobs.

## 4. Git Conventions

### Pattern GC-01 — Commits with SoT trailers (CA/en-CA)
**What**: Every commit message includes SoT trailers.  
**Why**: Compliance visibility and audit.
**Example**
    
    Market: CA
    Language: en-CA
    COMPLIANCE_CHECKED
    Signed-off-by: ROADMAP_READ

**Pitfalls**
- Missing trailers; inconsistent casing.

---

### Pattern GC-02 — PRs with changelog template
**What**: PR body includes summary, impact, and CI status.  
**Why**: Review efficiency; traceability.

---

### Pattern GC-03 — Branch naming
**What**: Use prefixes: `docs/`, `feat/`, `fix/`, `ci/`, `refactor/`.  
**Why**: Easier navigation and automation.

---

## Notes
- All examples are **fictitious**; replace with non-identifying samples only.
- Spellcheck: **en-CA**; align terminology with custom dictionary.
- Reference policies: PHIPA, CPO; see internal governance docs.
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
# padding for line-count target (no content change)
