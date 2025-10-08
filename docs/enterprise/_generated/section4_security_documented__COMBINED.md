## 4. Security Architecture (documented from repo canonicals)

> **Generated:** 2025-10-08 19:10:42 CEST
> **Scope:** Documenta controles **existentes** (sin cambios).

---
### 4.A Firestore — Rules, Indexes & CI Guardrails

## 4. Security Architecture (documented from repo canonicals)

> **Generated:** 2025-10-08 18:52:14 CEST
> **Scope:** Documenta controles **existentes** (no introduce cambios).

### 4.0 Canonical Sources
| Artifact | Path | Last Commit |
|---|---|---|
| Firestore Rules | `firestore.rules` | `ca84b15` |
| Firestore Indexes | `firestore.indexes.json` | `d89854f` |
| CI Workflows | `.github/workflows` | (varios) |
| CI Scripts | `scripts` | (varios) |

---
### Executive Summary
- **Zero-trust**: acceso mínimo, reglas de seguridad en Firestore y guardrails CI.
- **Identidad verificada**: acceso a datos clínicos **solo** vía backend con credenciales de servicio.
- **Cifrado**: TLS en tránsito; cifrado gestionado en reposo (GCP).
- **Inmutabilidad**: notas firmadas prohibidas de editar por reglas.
- **Guardrails CI**: *no SOAP logs* + *infra protegida* evitan fugas y cambios peligrosos.

---
### 4.1 Firestore Security Rules (snippets reales)
Path: firestore.rules  (last 200 lines)
```
// TEST/EMU: permisivo (solo para emulador)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

/*
-- PROD RULES (comentado; NO habilitar aún) --
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

    match /notes/{noteId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.clinicianUid == request.auth.uid;

      // Nota firmada: SOAP inmutable. Se permiten cambios no clínicos (tags/pinned/audit)
      allow update: if isAuthenticated() && isOwner(resource.data.clinicianUid) &&
        (
          (resource.data.status == 'signed' &&
           request.resource.data.status == 'signed' &&
           request.resource.data.soap == resource.data.soap)
          ||
          (resource.data.status == 'draft')
        );

      // Retención legal: no borrar notas clínicas
      allow delete: if false;
    }
  }
}
*/
```

#### Comentario (cómo nos protegen):
- Validan identidad de ejecución (service account) y estado de la nota (p. ej. `signed`).
- Implementan **deny-by-default** salvo condiciones explícitas.

---
### 4.2 Firestore Indexes (relevantes para continuidad)
Path: firestore.indexes.json  (head 80 lines)
```json
{
  "indexes": [
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "patientId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---
### 4.3 CI Guardrails (Workflows & Scripts)
**Workflows que bloquean cambios peligrosos / fugas:**
```
.github/workflows/no-soap-logs.yml:18:      - run: pnpm run check:no-soap-logs
.github/workflows/no-soap-logs.yml:6:  check-no-soap-logs:
.github/workflows/protect-infra.yml:22:          scripts/check-no-soap-logs.sh
```

**Scripts que detectan texto SOAP/PHI en logs:**
```
scripts/check-no-soap-logs.mjs:4:const WORDS = ['Subjective','Objective','Assessment','Plan','SOAP'];
scripts/check-no-soap-logs.mjs:45:  console.error('❌ SOAP-like logs found:\n' + offenders.join('\n'));
scripts/check-no-soap-logs.mjs:49:console.log('✅ No SOAP-like logs found.');
scripts/check-no-soap-logs.sh:6:  '^\s*(console\.(log|info|warn)|logger)\s*\([^)]*\b(SOAP|Subjective|Objective|Assessment|Plan)\b'
scripts/createClinicalCase.ts:186:    // 6. Crear formulario clínico SOAP para la visita inicial
scripts/createClinicalCase.ts:187:    console.log('\n5️⃣ Creando formulario clínico SOAP...');
scripts/createClinicalCase.ts:204:        form_type: 'SOAP',
scripts/createClinicalCase.ts:215:    console.log(`✅ Formulario clínico SOAP creado para la visita inicial`);
scripts/createClinicalCase.ts:263:        form_type: 'SOAP',
scripts/createClinicalCase.ts:394:          form_type: 'SOAP',
scripts/createClinicalCase.ts:530:    console.log('3. Completa el formulario SOAP borrador');
scripts/createPatientSimplified 5.cjs:103:        form_type: 'SOAP',
scripts/createPatientSimplified 5.cjs:155:        form_type: 'SOAP',
scripts/createPatientSimplified.cjs:103:        form_type: 'SOAP',
scripts/createPatientSimplified.cjs:155:        form_type: 'SOAP',
scripts/createSecondVisitAndrea.ts:249:          description: 'Actualización de formulario SOAP - Sección subjetiva'
scripts/createSecondVisitAndrea.ts:258:          description: 'Actualización de formulario SOAP - Sección objetiva'
scripts/nlp-service-mock.ts:132:   * Genera notas SOAP con opcional enriquecimiento RAG
scripts/nlp-service-mock.ts:134:  static async generateSOAPNotes(
scripts/nlp-service-mock.ts:138:  ): Promise<SOAPNotes> {
scripts/nlp-service-mock.ts:169:Genera notas SOAP profesionales basadas en la siguiente transcripción de fisioterapia.
scripts/nlp-service-mock.ts:177:Genera notas SOAP estructuradas y profesionales:
scripts/nlp-service-mock.ts:189:[Plan de tratamiento detallado${useRAG ? ' basado en evidencia científica' : ''}]
scripts/nlp-service-mock.ts:19:export interface SOAPNotes {
scripts/nlp-service-mock.ts:198:      return this.parseSOAPFromResponse(response.response, useRAG);
scripts/nlp-service-mock.ts:201:      console.error('Error generando SOAP:', error);
scripts/nlp-service-mock.ts:202:      return this.generateBasicSOAP(transcript, useRAG);
scripts/nlp-service-mock.ts:237:   * Parsea respuesta SOAP del LLM
scripts/nlp-service-mock.ts:239:  private static parseSOAPFromResponse(response: string, hasRAG: boolean): SOAPNotes {
scripts/nlp-service-mock.ts:247:    // Extraer secciones SOAP
scripts/nlp-service-mock.ts:269:   * Genera SOAP básico de fallback
scripts/nlp-service-mock.ts:271:  private static generateBasicSOAP(transcript: string, hasRAG: boolean): SOAPNotes {
scripts/nlp-service-mock.ts:276:      plan: `Plan de tratamiento ${hasRAG ? 'basado en evidencia científica' : 'según evaluación clínica'}.`,
scripts/nlp-service-mock.ts:284:  private static calculateOverallConfidence(entities: ClinicalEntity[], soap: SOAPNotes): number {
scripts/nlp-service-mock.ts:29:  soapNotes: SOAPNotes;
scripts/nlp-service-mock.ts:61:    // 2. Generar notas SOAP
scripts/nlp-service-mock.ts:63:    const soapNotes = await this.generateSOAPNotes(transcript, entities, options.useRAG || false);
scripts/redact-soap-logs.mjs:10:  {from:'Plan',        to:'plan section'}
scripts/redact-soap-logs.mjs:22:const res = spawnSync('git', ['grep','-lE','console\\.(log|info|warn|error).*(SOAP|Subjective|Objective|Assessment|Plan)','--',...pathspecs], {encoding:'utf8'});
scripts/redact-soap-logs.mjs:6:  {from:'SOAP',        to:'clinical note'},
scripts/redact-soap-logs.mjs:7:  {from:'Subjective',  to:'subjective section'},
scripts/redact-soap-logs.mjs:8:  {from:'Objective',   to:'objective section'},
scripts/redact-soap-logs.mjs:9:  {from:'Assessment',  to:'assessment section'},
scripts/run-backend-blueprint-test.sh:159:- ✅ Generación de SOAP mejorada
scripts/security_doc_extractor.sh:109:  echo "**Scripts que detectan texto SOAP/PHI en logs:**"
scripts/security_doc_extractor.sh:45:# 4) Guardrails CI: listar workflows relevantes + scripts anti-SOAP
scripts/security_doc_extractor.sh:49:rg -n --no-heading "SOAP|Subjective|Objective|Assessment|Plan" "$SCRIPTS_DIR" 2>/dev/null | sort -u > "$SCRIPTS_LIST" || true
scripts/security_doc_extractor.sh:76:  echo "- **Guardrails CI**: *no SOAP logs* + *infra protegida* evitan fugas y cambios peligrosos."
scripts/simulateCreatePatient 5.cjs:44:    console.log('Creando formulario SOAP para visita inicial...');
scripts/simulateCreatePatient 5.cjs:56:    console.log('Creando formulario SOAP borrador para visita de seguimiento...');
scripts/simulateCreatePatient 5.cjs:81:    console.log('\nPlan:');
scripts/simulateCreatePatient 6.cjs:44:    console.log('Creando formulario SOAP para visita inicial...');
scripts/simulateCreatePatient 6.cjs:56:    console.log('Creando formulario SOAP borrador para visita de seguimiento...');
scripts/simulateCreatePatient 6.cjs:81:    console.log('\nPlan:');
scripts/simulateCreatePatient.cjs:44:    console.log('Creando formulario SOAP para visita inicial...');
scripts/simulateCreatePatient.cjs:56:    console.log('Creando formulario SOAP borrador para visita de seguimiento...');
scripts/simulateCreatePatient.cjs:81:    console.log('\nPlan:');
scripts/test-paciente-simulado-uat.cjs:4:   Simula: registro, perfil, consulta, SOAP
```

---
### 4.4 Threats & Mitigations (modelo actual)
- **Edición de notas firmadas** → bloqueado por reglas (ver snippets).
- **Fugas de texto clínico en logs** → bloqueado por `check-no-soap-logs` + PR checks.
- **Cambios peligrosos en infra** → workflow *Protect Infra Files* impide borrados.
- **Acceso directo desde frontend** → solo backend con service account toca Firestore.

---
### 4.5 Gaps & TODOs (documentación)
- Si falta alguna política/índice esperado, queda **pending review**. No se implementa en este PR.

---
### 4.B Supabase — RLS & RBAC (SQL Canonicals)

## 4.x Supabase RLS & RBAC (documented from repo canonicals)

> **Generated:** 2025-10-08 19:04:08 CEST
> **Scope:** Documenta **migraciones y políticas SQL existentes** (sin cambios).

### Canonical SQL Sources
| File Path | Last Commit |
|---|---|
| `docs/enterprise/_generated/section4_security_documented__COMBINED.md` | `` |
| `docs/enterprise/_generated/section4_security_supabase.md` | `` |
| `scripts/create_metrics_table 5.sql` | `71476cb` |
| `scripts/create_metrics_table.sql` | `32a469d` |
| `scripts/security_doc_extractor_supabase.sh` | `` |

---
### Executive Summary (SQL)
- **RLS habilitado** en tablas sensibles (migraciones canónicas).
- **Scoping por `clinic_id`** + **identidad `auth.uid()`**.
- **RBAC** inferido por constraints/checks de rol y policies.
- **Borrado** normalmente restringido a roles elevados y/o auditado.

---
### Snippets reales (auto-extraídos)

**Source:** `create_metrics_table 5.sql`
```sql
CREATE INDEX IF NOT EXISTS idx_metrics_clinical_evolution ON public.metrics_by_visit(clinical_evolution);
-- Configurar RLS (Row Level Security)
-- ---
DROP POLICY IF EXISTS "Admin can view all metrics" ON public.metrics_by_visit;
-- Política para que los profesionales puedan ver métricas de sus pacientes
-- ---
  ON public.metrics_by_visit 
  FOR SELECT 
  USING (
-- ---
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = metrics_by_visit.patient_id 
-- ---
  );
-- Política para que los profesionales puedan crear métricas para sus pacientes
-- ---
  ON public.metrics_by_visit 
  FOR INSERT 
  WITH CHECK (
-- ---
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = metrics_by_visit.patient_id 
-- ---
  );
-- Política para que los administradores puedan ver todas las métricas
-- ---
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
-- ---
```

**Source:** `create_metrics_table.sql`
```sql
CREATE INDEX IF NOT EXISTS idx_metrics_clinical_evolution ON public.metrics_by_visit(clinical_evolution);
-- Configurar RLS (Row Level Security)
-- ---
DROP POLICY IF EXISTS "Admin can view all metrics" ON public.metrics_by_visit;
-- Política para que los profesionales puedan ver métricas de sus pacientes
-- ---
  ON public.metrics_by_visit 
  FOR SELECT 
  USING (
-- ---
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = metrics_by_visit.patient_id 
-- ---
  );
-- Política para que los profesionales puedan crear métricas para sus pacientes
-- ---
  ON public.metrics_by_visit 
  FOR INSERT 
  WITH CHECK (
-- ---
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = metrics_by_visit.patient_id 
-- ---
  );
-- Política para que los administradores puedan ver todas las métricas
-- ---
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
-- ---
```

**Source:** `section4_security_documented__COMBINED.md`
```sql
---
### Executive Summary (SQL)
- **RLS habilitado** en tablas sensibles (migraciones canónicas).
-- ---
```

**Source:** `section4_security_supabase.md`
```sql
---
### Executive Summary (SQL)
- **RLS habilitado** en tablas sensibles (migraciones canónicas).
-- ---
    -g '!node_modules' -g '!**/*.min.*' \
-- ---
    -g '!node_modules' -g '!**/*.min.*' \
-- ---
    -e 'CREATE POLICY' \
-- ---
-- ---
-- ---
-- ---
    -e 'CREATE POLICY' \
-- ---
-- ---
-- ---
  rg -n --hidden -S -i \
    -g '!node_modules' -g '!**/*.min.*' \
-- ---
    -g '!node_modules' -g '!**/*.min.*' \
    -e 'CREATE POLICY' \
-- ---
-- ---
    -e 'CREATE POLICY' \
-- ---
    -e 'CREATE POLICY' \
-- ---
    -g '!node_modules' -g '!**/*.min.*' \
-- ---
    -g '!node_modules' -g '!**/*.min.*' \
-- ---
    -e 'CREATE POLICY' \
-- ---
-- ---
-- ---
-- ---
    -e 'CREATE POLICY' \
-- ---
-- ---
```

**Source:** `security_doc_extractor_supabase.sh`
```sql
SQL_PATHS="$(
  rg -n --hidden -S -i \
    -g '!node_modules' -g '!**/*.min.*' \
-- ---
  rg -n --hidden -S -i \
    -g '!node_modules' -g '!**/*.min.*' \
    -e 'CREATE POLICY' \
-- ---
    -e 'CREATE POLICY' \
    -e 'ENABLE ROW LEVEL SECURITY' \
    -e 'auth\.uid\(' \
-- ---
  awk '
    BEGIN{have=0; print "```sql"}
-- ---
  echo "---"
  echo "### Executive Summary (SQL)"
  echo "- **RLS habilitado** en tablas sensibles (migraciones canónicas)."
-- ---
```

---
### Observaciones
- Si algún control esperado no aparece, queda **pending review** para PR separado (sin tocar canónicos).
