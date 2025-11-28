# 📱 PROPUESTA: CONSENTIMIENTO VÍA SMS/PORTAL - ENFOQUE PROFESIONAL

**Fecha:** Noviembre 16, 2025  
**Problema:** Modal en workflow interrumpe flujo profesional  
**Solución:** Portal de consentimiento dedicado + SMS/Email al paciente  
**Prioridad:** ALTA - Mejora UX y compliance

---

## 🎯 VENTAJAS DEL NUEVO APPROACH

### **vs Modal en Workflow:**

✅ **No interrumpe workflow del fisio**  
✅ **Más profesional** - Enfoque en derechos del paciente  
✅ **Mejor compliance** - Consentimiento documentado con firma digital  
✅ **Estándar médico** - Similar a otros consentimientos clínicos  
✅ **Mejor UX** - Paciente puede revisar en su tiempo  
✅ **Future-proof** - Cubre todas las herramientas tecnológicas  

---

## 📋 ARQUITECTURA PROPUESTA

### **1. Flujo de Consentimiento:**

```
1. Fisio inicia primera sesión con paciente
   ↓
2. Sistema detecta que es primera sesión
   ↓
3. Sistema genera token único de consentimiento
   ↓
4. Sistema envía SMS/Email al paciente con enlace
   ↓
5. Paciente abre portal de consentimiento (/consent/:token)
   ↓
6. Paciente lee derechos y opciones
   ↓
7. Paciente selecciona opción y firma digitalmente
   ↓
8. Sistema guarda consentimiento en Firestore
   ↓
9. Workflow del fisio se desbloquea automáticamente
```

### **2. Portal de Consentimiento:**

**Ruta:** `/consent/:token`

**Estructura:**
- Header: Información del paciente, fisio, clínica
- Sección 1: Derechos del paciente bajo PHIPA
- Sección 2: Tratamiento de datos (tecnologías usadas)
- Sección 3: Opciones de consentimiento
- Firma digital

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **1. Servicio de Consentimiento por Token:**

```typescript
// src/services/patientConsentService.ts

export interface PatientConsentToken {
  token: string;
  patientId: string;
  patientName: string;
  clinicName: string;
  physiotherapistName: string;
  physiotherapistId: string;
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  consentGiven?: {
    scope: 'ongoing' | 'session-only' | 'declined';
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export class PatientConsentService {
  static async generateConsentToken(
    patientId: string,
    patientName: string,
    clinicName: string,
    physiotherapistId: string,
    physiotherapistName: string
  ): Promise<string> {
    // Generate unique token
    // Save to Firestore collection 'patient_consent_tokens'
    // Return token
  }

  static async getConsentByToken(token: string): Promise<PatientConsentToken | null> {
    // Fetch from Firestore
  }

  static async recordConsent(
    token: string,
    scope: 'ongoing' | 'session-only' | 'declined'
  ): Promise<void> {
    // Mark token as used
    // Save consent to Firestore collection 'patient_consents'
    // Link to patient record
  }

  static async hasConsent(patientId: string): Promise<boolean> {
    // Check if patient has valid ongoing consent
  }
}
```

### **2. Servicio de SMS (Stub para MVP):**

```typescript
// src/services/smsService.ts

export class SMSService {
  static async sendConsentLink(
    phone: string,
    patientName: string,
    clinicName: string,
    consentToken: string
  ): Promise<void> {
    // TODO: Integrate with Twilio or similar
    // For MVP: Log to console and save to Firestore for manual sending
    
    const message = `Hola ${patientName}, ${clinicName} necesita su consentimiento informado para el tratamiento de datos personales de salud según ley canadiense.

Revise y autorice: https://aiduxcare.ca/consent/${consentToken}

${clinicName}
Responder STOP para cancelar.`;

    console.log('[SMS] Would send:', message);
    
    // Save to Firestore for manual sending or future integration
    // await addDoc(collection(db, 'pending_sms'), { phone, message, timestamp: serverTimestamp() });
  }
}
```

### **3. Portal de Consentimiento:**

```typescript
// src/pages/PatientConsentPortalPage.tsx

export const PatientConsentPortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [consentData, setConsentData] = useState<PatientConsentToken | null>(null);
  const [selectedScope, setSelectedScope] = useState<'ongoing' | 'session-only' | 'declined'>('ongoing');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch consent data by token
    PatientConsentService.getConsentByToken(token).then(setConsentData).finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    await PatientConsentService.recordConsent(token, selectedScope);
    // Show success message
    // Redirect or show confirmation
  };

  return (
    <div className="patient-consent-portal">
      {/* Header with patient/clinic info */}
      {/* PHIPA Rights Section */}
      {/* Data Processing Disclosure */}
      {/* Consent Options */}
      {/* Digital Signature */}
    </div>
  );
};
```

### **4. Actualización del Workflow:**

```typescript
// src/pages/ProfessionalWorkflowPage.tsx

// REMOVER: Modal de consentimiento del workflow
// AGREGAR: Verificación de consentimiento del paciente

useEffect(() => {
  const checkPatientConsent = async () => {
    const patientId = demoPatient.id;
    const hasConsent = await PatientConsentService.hasConsent(patientId);
    
    if (!hasConsent && isFirstSession) {
      // Generate consent token
      const token = await PatientConsentService.generateConsentToken(
        patientId,
        demoPatient.name,
        'Clínica Demo', // TODO: Get from clinic settings
        user?.uid || TEMP_USER_ID,
        'Dr. Smith' // TODO: Get from user profile
      );
      
      // Send SMS/Email (or queue for sending)
      await SMSService.sendConsentLink(
        demoPatient.phone, // TODO: Get from patient record
        demoPatient.name,
        'Clínica Demo',
        token
      );
      
      // Show notification to physio (not blocking modal)
      setConsentPending(true);
      setConsentToken(token);
    }
  };
  
  checkPatientConsent();
}, [isFirstSession]);
```

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

### **ANTES (Modal en Workflow):**
- ❌ Interrumpe flujo del fisio
- ❌ Fisio debe leer al paciente (no ideal)
- ❌ No hay firma digital
- ❌ Enfoque en producto (AiduxCare)
- ❌ Solo cubre AiduxCare

### **DESPUÉS (Portal + SMS):**
- ✅ No interrumpe workflow
- ✅ Paciente revisa en su tiempo
- ✅ Firma digital documentada
- ✅ Enfoque en derechos del paciente
- ✅ Cubre todas las herramientas tecnológicas
- ✅ Estándar médico profesional

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Servicios Base (2-3 horas)**
1. Crear `patientConsentService.ts`
2. Crear `smsService.ts` (stub para MVP)
3. Crear Firestore collections: `patient_consent_tokens`, `patient_consents`

### **Fase 2: Portal de Consentimiento (3-4 horas)**
1. Crear `PatientConsentPortalPage.tsx`
2. Agregar ruta `/consent/:token` al router
3. Implementar UI con secciones de derechos
4. Implementar firma digital

### **Fase 3: Integración Workflow (1-2 horas)**
1. Remover modal de consentimiento del workflow
2. Agregar verificación de consentimiento del paciente
3. Agregar notificación no bloqueante si falta consentimiento
4. Generar token y enviar SMS cuando sea primera sesión

### **Fase 4: Testing (1-2 horas)**
1. Test de generación de token
2. Test de portal de consentimiento
3. Test de verificación de consentimiento
4. Test de flujo completo

**Total estimado: 7-11 horas**

---

## ✅ VENTAJAS COMPETITIVAS

### **vs Jane.app:**
- **Jane**: Consentimiento genérico, poco transparente
- **AiduxCare**: Portal dedicado, derechos completos, firma digital

### **vs Competidores:**
- **Transparencia total** sobre procesamiento de datos
- **Estándar médico** de consentimiento informado
- **Derechos del paciente** como prioridad
- **Compliance superior** con PHIPA/PIPEDA

---

## 📋 DECISIÓN REQUERIDA

**¿Procedemos con esta implementación?**

Esta aproximación es:
- ✅ Más profesional
- ✅ Mejor UX para fisio y paciente
- ✅ Mejor compliance legal
- ✅ Más escalable para futuras herramientas

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

