import React from 'react';
import { isSpainPilot } from '@/core/pilotDetection';

const LAST_UPDATED_CA = 'January 18, 2026';
const LAST_UPDATED_ES = '22 de marzo de 2026';

// ─── Spain pilot: Política de Privacidad (RGPD) ───────────────────────────────
const PrivacyPolicySpain: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-10">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">
          Política de Privacidad — AiduxCare (Piloto España)
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Última actualización: {LAST_UPDATED_ES}
        </p>

        <div className="prose prose-slate max-w-none">

          <section className="mb-8">
            <h2>1. Responsable del Tratamiento</h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="mb-1"><strong>AiduxCare Inc.</strong></p>
              <p className="mb-1">Correo electrónico: <a href="mailto:privacy@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">privacy@aiduxcare.com</a></p>
              <p className="mb-0">Calle del Escultor José Capuz 23, CP 46006, Valencia, España</p>
            </div>
            <p className="mt-4">
              AiduxCare actúa como <strong>encargado del tratamiento</strong> en el sentido del artículo 28 del Reglamento (UE) 2016/679 (RGPD), procesando datos de salud por cuenta del profesional sanitario (<strong>responsable del tratamiento</strong>) que contrata y utiliza el servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2>2. Datos que tratamos</h2>
            <p>En función de las funcionalidades utilizadas, podemos tratar las siguientes categorías de datos:</p>
            <ul>
              <li><strong>Datos de cuenta del profesional:</strong> nombre, apellidos, email, número de colegiado, especialidad y configuración de seguridad (p. ej., MFA).</li>
              <li><strong>Datos clínicos del paciente introducidos por el profesional:</strong> notas SOAP, planes de tratamiento, programa domiciliario (HEP) y otra documentación clínica.</li>
              <li><strong>Datos de consentimiento:</strong> tokens de consentimiento, marcas de tiempo, estado y registros de auditoría.</li>
              <li><strong>Datos técnicos y de seguridad:</strong> información básica de dispositivo/navegador, dirección IP, registros y metadatos de eventos para seguridad y trazabilidad.</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <p className="text-amber-900 text-sm">
                <strong>Datos de categoría especial (art. 9 RGPD):</strong> Los datos de salud de los pacientes son datos de categoría especial. Su tratamiento se ampara en el art. 9.2.h) RGPD (fines de asistencia sanitaria) y en la Ley Orgánica 3/2018 (LOPDGDD). El profesional sanitario es el responsable del tratamiento de dichos datos y AiduxCare actúa como encargado conforme al acuerdo suscrito.
              </p>
            </div>
            <p className="mt-4 font-medium">No vendemos datos personales ni datos de salud a terceros.</p>
          </section>

          <section className="mb-8">
            <h2>3. Finalidad y base jurídica del tratamiento</h2>
            <ul>
              <li>
                <strong>Prestación del servicio y documentación clínica asistida:</strong> base jurídica — ejecución del contrato (art. 6.1.b) RGPD) y, para datos de salud, asistencia sanitaria (art. 9.2.h) RGPD).
              </li>
              <li>
                <strong>Seguridad, trazabilidad y cumplimiento normativo:</strong> base jurídica — interés legítimo (art. 6.1.f) RGPD) y obligación legal (art. 6.1.c) RGPD).
              </li>
              <li>
                <strong>Comunicaciones sobre el servicio:</strong> base jurídica — ejecución del contrato o consentimiento, según el caso.
              </li>
              <li>
                <strong>Envío de resumen de sesión al paciente (email):</strong> base jurídica — consentimiento explícito del paciente e instrucción del profesional responsable del tratamiento.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>4. Transferencias internacionales y encargados de tratamiento</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-blue-900 font-semibold mb-2">Procesamiento de IA (Vertex AI — Google Cloud)</h3>
              <p className="text-blue-800 text-sm">
                El análisis clínico y la generación de notas SOAP se realizan mediante <strong>Google Cloud Vertex AI (Gemini 2.5 Flash)</strong> en la región <strong>northamerica-northeast1 (Montréal, Canadá)</strong>. Google actúa como encargado del tratamiento al amparo de las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea (art. 46.2.c) RGPD).
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h3 className="text-amber-900 font-semibold mb-2">Transcripción de audio (OpenAI Whisper)</h3>
              <p className="text-amber-800 text-sm">
                La función de grabación y transcripción de audio puede utilizar la API de OpenAI Whisper (Estados Unidos). Esta transferencia internacional está amparada en las Cláusulas Contractuales Tipo (art. 46.2.c) RGPD). Se informa al profesional antes de activar dicha función.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-slate-900 font-semibold mb-2">Envío de email (Resend)</h3>
              <p className="text-slate-700 text-sm">
                El envío de resúmenes de sesión al paciente por correo electrónico se realiza a través de <strong>Resend Inc.</strong> (Estados Unidos), encargado del tratamiento con las garantías adecuadas previstas en el RGPD.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2>5. Derechos de los interesados</h2>
            <p>
              De conformidad con los artículos 15 a 22 del RGPD y la LOPDGDD, los interesados pueden ejercer los siguientes derechos:
            </p>
            <ul>
              <li><strong>Acceso (art. 15):</strong> conocer qué datos se tratan.</li>
              <li><strong>Rectificación (art. 16):</strong> corregir datos inexactos.</li>
              <li><strong>Supresión (art. 17):</strong> solicitar la eliminación, salvo que existan obligaciones legales de conservación.</li>
              <li><strong>Oposición (art. 21):</strong> oponerse al tratamiento basado en interés legítimo.</li>
              <li><strong>Limitación (art. 18):</strong> solicitar la restricción del tratamiento.</li>
              <li><strong>Portabilidad (art. 20):</strong> recibir los datos en formato estructurado y legible por máquina.</li>
            </ul>
            <p className="mt-4">
              Los pacientes deben dirigir sus solicitudes en primer lugar al <strong>profesional sanitario responsable del tratamiento</strong>. Si precisan contactar directamente con AiduxCare, pueden hacerlo en <a href="mailto:privacy@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">privacy@aiduxcare.com</a> con el asunto <strong>"Ejercicio de derechos RGPD"</strong>.
            </p>
            <p className="mt-2">
              Asimismo, tienen derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> — <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">www.aepd.es</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2>6. Conservación de datos</h2>
            <p>
              Los datos se conservan durante el tiempo necesario para la prestación del servicio y el cumplimiento de las obligaciones legales aplicables. Los datos de salud están sujetos a los plazos de conservación de la historia clínica establecidos por la normativa sanitaria española (mínimo 5 años desde el alta, sin perjuicio de plazos autonómicos).
            </p>
          </section>

          <section className="mb-8">
            <h2>7. Medidas de seguridad</h2>
            <p>AiduxCare aplica medidas técnicas y organizativas adecuadas al nivel de riesgo, que incluyen:</p>
            <ul>
              <li>Cifrado en tránsito (TLS) y en reposo.</li>
              <li>Controles de acceso basados en roles y autenticación de múltiples factores (MFA).</li>
              <li>Registros de auditoría y monitorización continua.</li>
              <li>Principio de mínimo privilegio en accesos internos.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>8. Contacto y DPO</h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="mb-2">
                <strong>Email privacidad:</strong>{' '}
                <a href="mailto:privacy@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">privacy@aiduxcare.com</a>
              </p>
              <p className="mb-0">
                <strong>Dirección postal:</strong> AiduxCare Inc., Niagara Falls Innovation Hub, 4255 Queen St, Niagara Falls, ON L2E 2L3, Canadá
              </p>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Respondemos en un plazo máximo de <strong>30 días hábiles</strong> conforme al art. 12 RGPD.
            </p>
          </section>

        </div>
      </div>
    </div>
  </div>
);

// ─── Canada (default): Privacy Policy (PHIPA/PIPEDA) ─────────────────────────
const PrivacyPolicyCanada: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-10">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">
          AiduxCare Privacy Policy (Pilot)
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Last updated: {LAST_UPDATED_CA}
        </p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2>1. Scope</h2>
            <p>
              This Privacy Policy explains how <strong>AiduxCare Inc.</strong> ("AiduxCare", "we", "our") collects, uses, discloses, and protects <strong>personal information</strong> and, where applicable, <strong>personal health information (PHI)</strong> when Canadian healthcare professionals use AiduxCare.
            </p>
            <p>
              In Ontario, clinicians are typically the <strong>Health Information Custodian (HIC)</strong> under PHIPA, and AiduxCare generally acts as a <strong>service provider / agent</strong> processing information on the clinician's behalf, subject to applicable agreements and instructions.
            </p>
          </section>

          <section className="mb-8">
            <h2>2. Information We Collect</h2>
            <p>Depending on the features used, we may collect:</p>
            <ul>
              <li><strong>Clinician account data:</strong> name, email, clinic information, authentication and security settings (e.g., MFA status), and licensing/professional profile details (if provided).</li>
              <li><strong>Patient and clinical data entered by the clinician:</strong> intake details, clinical notes (e.g., SOAP), care plans, and related documentation.</li>
              <li><strong>Consent workflow data:</strong> consent tokens, timestamps, status (e.g., granted/declined), and audit events related to consent.</li>
              <li><strong>Technical and security data:</strong> basic device/browser information, IP address, logs and event metadata used for security, troubleshooting, and auditability.</li>
            </ul>
            <p className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
              <strong>We do not sell personal information or PHI.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2>3. How We Use Information</h2>
            <p>We use information to:</p>
            <ul>
              <li>Provide the AiduxCare service and core workflows (e.g., documentation assistance, note generation, portals where enabled).</li>
              <li>Maintain <strong>auditability</strong> and operational integrity (e.g., security logging, access events, and troubleshooting).</li>
              <li>Enforce security controls, prevent abuse, and protect users and patients.</li>
              <li>Communicate product and security updates relevant to use of the service.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>4. Data Residency and AI Processing</h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <h3 className="text-emerald-900 font-semibold mb-2">Canadian processing (default)</h3>
              <p className="text-emerald-800 text-sm">
                Core AI workflows (e.g., clinical analysis and note generation) are designed to run using <strong>Google Cloud Vertex AI</strong> in <strong>northamerica-northeast1 (Montréal, Canada)</strong>.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-amber-900 font-semibold mb-2">Cross-border services (disclosed)</h3>
              <p className="text-amber-800 text-sm">
                Audio transcription features may be processed by a third-party provider outside Canada (e.g., the United States) when clinicians use the recording feature. We disclose this transfer and its purpose.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2>5. Legal Basis and Patient Rights</h2>
            <ul>
              <li><strong>PHIPA (Ontario):</strong> AiduxCare processes PHI on behalf of clinicians/HICs, following their instructions and applicable agreements.</li>
              <li><strong>PIPEDA (Canada):</strong> Individuals may request access and correction of their personal information. In clinical contexts, requests are typically handled through the treating clinician/HIC.</li>
            </ul>
            <p>
              Where permitted and applicable, individuals may also request deletion or restriction—subject to clinical, legal, and regulatory record-retention obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2>6. Security Safeguards</h2>
            <p>We use administrative, technical, and organizational safeguards appropriate to the sensitivity of the information, which may include:</p>
            <ul>
              <li>Encryption in transit and at rest (where supported by our infrastructure providers).</li>
              <li>Access controls and authentication safeguards (including MFA support).</li>
              <li>Logging and monitoring to detect suspicious activity and support auditability.</li>
              <li>Least-privilege access for internal operations.</li>
            </ul>
            <p>No method of transmission or storage is 100% secure; however, we work to protect information using reasonable safeguards.</p>
          </section>

          <section className="mb-8">
            <h2>7. Retention</h2>
            <p>
              We retain information for as long as necessary to provide the service, meet contractual obligations, support auditability, and comply with applicable laws. Retention periods may vary depending on the data type and clinical/legal requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2>8. Contact and Privacy Requests</h2>
            <p>For privacy questions or requests:</p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">privacy@aiduxcare.com</a>
              </p>
              <p>
                <strong>Postal (Pilot / Niagara Hub):</strong><br />
                AiduxCare Inc.<br />
                <strong>Niagara Falls Innovation Hub</strong><br />
                4255 Queen St, Niagara Falls, ON L2E 2L3, Canada
              </p>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              If you are a patient, please contact your treating clinician first. If needed, you may also contact us with the subject line <strong>"Privacy Request"</strong>. We respond within a reasonable timeframe and in accordance with applicable law.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
);

// ─── Route entry point ─────────────────────────────────────────────────────────
const PrivacyPolicyPage: React.FC = () =>
  isSpainPilot() ? <PrivacyPolicySpain /> : <PrivacyPolicyCanada />;

export default PrivacyPolicyPage;
