import React from 'react';
import { isSpainPilot } from '@/core/pilotDetection';

/**
 * Terms of Service / Términos de Uso
 * - Spain pilot: RGPD + ley española (LOPDGDD, Ley 34/2002 LSSI)
 * - Canada (default): PHIPA/PIPEDA
 */

// ─── Spain pilot: Términos de Uso ─────────────────────────────────────────────
const TermsOfServiceSpain: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Términos de Uso — AiduxCare (Piloto España)
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          <strong>Última actualización:</strong> 22 de marzo de 2026
        </p>

        <div className="prose prose-lg max-w-none">

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Objeto y ámbito de aplicación</h2>
            <p className="text-gray-700 mb-4">
              AiduxCare es un copiloto clínico inteligente diseñado para <strong>asistir</strong> a profesionales sanitarios en la documentación clínica. No sustituye el criterio clínico del profesional. El servicio se rige por:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>El Reglamento (UE) 2016/679 (RGPD)</li>
              <li>La Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)</li>
              <li>La Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI)</li>
              <li>La normativa sanitaria aplicable en España (Ley 41/2002, básica reguladora de la autonomía del paciente)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Responsabilidades del profesional sanitario</h2>
            <p className="text-gray-700 mb-4">
              Al utilizar AiduxCare, el profesional acepta:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Mantener el criterio clínico independiente y supervisar todas las sugerencias del sistema.</li>
              <li>Asumir la responsabilidad final de todas las decisiones clínicas.</li>
              <li>Actuar como <strong>responsable del tratamiento</strong> de los datos de salud de sus pacientes conforme al art. 4.7 RGPD.</li>
              <li>Obtener el consentimiento informado del paciente antes de utilizar las funcionalidades de grabación de audio y análisis clínico.</li>
              <li>No introducir datos de pacientes de forma identificada más allá de lo estrictamente necesario para la asistencia.</li>
              <li>Cumplir con el código deontológico de su colegio profesional.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Prestadores de servicios de IA (encargados del tratamiento, art. 28 RGPD)</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Divulgación obligatoria — art. 28 RGPD</h3>
              <p className="text-blue-800 mb-3">
                AiduxCare utiliza los siguientes encargados del tratamiento para la prestación del servicio:
              </p>
              <ul className="list-disc pl-6 text-blue-800 space-y-3">
                <li>
                  <strong>Transcripción de audio:</strong> OpenAI (API Whisper)<br />
                  <span className="text-sm">Ubicación: Estados Unidos | Finalidad: transcripción de audio (opcional) | Garantías: Cláusulas Contractuales Tipo (art. 46.2.c) RGPD)</span>
                </li>
                <li>
                  <strong>Análisis clínico y generación de notas SOAP:</strong> Google Cloud Platform — Vertex AI (Gemini 2.5 Flash)<br />
                  <span className="text-sm">Ubicación: Canadá (northamerica-northeast1, Montréal) | Finalidad: asistencia en documentación clínica | Garantías: Cláusulas Contractuales Tipo</span>
                </li>
                <li>
                  <strong>Envío de email al paciente:</strong> Resend Inc.<br />
                  <span className="text-sm">Ubicación: Estados Unidos | Finalidad: envío de resúmenes de sesión al paciente (solo cuando el profesional lo activa) | Garantías: Cláusulas Contractuales Tipo</span>
                </li>
                <li>
                  <strong>Infraestructura y base de datos:</strong> Google Firebase / Google Cloud Platform<br />
                  <span className="text-sm">Ubicación: Canadá/UE | Finalidad: almacenamiento y autenticación | Garantías: Cláusulas Contractuales Tipo</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Tratamiento de datos y seguridad</h2>
            <p className="text-gray-700 mb-4">Los datos clínicos se procesan del siguiente modo:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Las grabaciones de audio se transcriben mediante la API Whisper de OpenAI (EE. UU.), previa información al profesional.</li>
              <li>El análisis clínico y la generación de notas SOAP se realizan con Google Vertex AI (región Canadá).</li>
              <li>Los datos están cifrados en tránsito (TLS) y en reposo.</li>
              <li>El acceso está restringido al personal autorizado con principio de mínimo privilegio.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Limitaciones del servicio</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>El sistema no sustituye la evaluación clínica profesional.</li>
              <li>Los resultados deben ser interpretados por el profesional cualificado.</li>
              <li>No se garantiza exactitud absoluta en todas las situaciones.</li>
              <li>Es obligatoria la supervisión humana constante de las sugerencias del sistema.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Uso aceptable</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Exclusivamente para profesionales sanitarios autorizados en ejercicio legal de su profesión en España.</li>
              <li>En entornos clínicos adecuados con respeto a la confidencialidad del paciente.</li>
              <li>Para fines de documentación y asistencia clínica, nunca para toma de decisiones autónoma sin supervisión.</li>
              <li>Queda prohibido el uso para fines distintos de los clínicos o la cesión de acceso a terceros no autorizados.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cumplimiento normativo</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">RGPD + LOPDGDD (España / UE)</h3>
              <p className="text-green-800">
                AiduxCare cumple con el Reglamento General de Protección de Datos (UE) 2016/679 y la Ley Orgánica 3/2018. Todos los encargados del tratamiento han suscrito los acuerdos exigidos por el art. 28 RGPD. Los interesados pueden ejercer sus derechos ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Ley 41/2002 — Autonomía del paciente</h3>
              <p className="text-purple-800">
                El profesional sanitario es responsable de obtener el consentimiento informado del paciente y de garantizar el ejercicio de sus derechos de acceso a la historia clínica conforme a la Ley 41/2002.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Suspensión del servicio</h2>
            <p className="text-gray-700 mb-4">AiduxCare podrá suspender o cancelar el acceso en caso de:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Incumplimiento de estos términos o de la normativa aplicable.</li>
              <li>Uso inadecuado o fraudulento del sistema.</li>
              <li>Compromiso de la seguridad del sistema o de los datos de terceros.</li>
              <li>Incumplimiento de las obligaciones deontológicas o profesionales.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Ley aplicable y jurisdicción</h2>
            <p className="text-gray-700">
              Los presentes términos se rigen por la legislación española y de la Unión Europea. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales competentes de España, sin perjuicio de los derechos de los consumidores conforme a la normativa aplicable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contacto</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>Email legal:</strong> <a href="mailto:legal@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">legal@aiduxcare.com</a><br />
                <strong>Privacidad / RGPD:</strong> <a href="mailto:privacy@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">privacy@aiduxcare.com</a><br />
                <strong>Dirección:</strong> Calle del Escultor José Capuz 23, CP 46006, Valencia, España
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  </div>
);

// ─── Canada (default): Terms of Service (PHIPA/PIPEDA) ───────────────────────
const TermsOfServiceCanada: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 font-apple">
          Terms of Service - AiduxCare
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Purpose of the System</h2>
            <p className="text-gray-700 mb-4">
              AiduxCare is an intelligent clinical copilot designed to assist healthcare professionals, not to replace them. The system provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI-assisted clinical documentation</li>
              <li>Structured SOAP note generation</li>
              <li>Red flag and contraindication detection</li>
              <li>Clinical workflow optimization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Professional Responsibilities</h2>
            <p className="text-gray-700 mb-4">By using AiduxCare, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Maintain independent clinical judgment</li>
              <li>Review and validate all system suggestions</li>
              <li>Assume final responsibility for all clinical decisions</li>
              <li>Not delegate critical decisions to the AI system</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Service Providers</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Required Disclosure - PHIPA Section 18</h3>
              <p className="text-blue-800 mb-3">
                AiduxCare uses the following third-party artificial intelligence processors to provide services:
              </p>
              <ul className="list-disc pl-6 text-blue-800 space-y-2">
                <li>
                  <strong>Speech Recognition:</strong> OpenAI (Whisper API)<br />
                  <span className="text-sm">Location: United States | Purpose: Audio transcription (optional)</span>
                </li>
                <li>
                  <strong>Clinical Analysis &amp; SOAP Generation:</strong> Google Cloud Platform — Vertex AI (Gemini 2.5 Flash)<br />
                  <span className="text-sm">Location: Canada (northamerica-northeast1, Montreal) | Purpose: Clinical insights &amp; documentation</span>
                </li>
              </ul>
              <p className="text-blue-800 mt-3 text-sm">
                <strong>Important:</strong> All AI processing initiated by AiduxCare is routed through Canadian infrastructure by default. Any cross-border processing (e.g., Whisper transcription) is disclosed to the treating physiotherapist for PHIPA/PIPEDA compliance.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Processing and Storage</h2>
            <p className="text-gray-700 mb-4">Your clinical data is processed as follows:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Audio recordings are transcribed using OpenAI Whisper API</li>
              <li>Clinical analysis is performed using Google Vertex AI (Gemini models)</li>
              <li>SOAP notes are generated using Google Vertex AI (Gemini models, Canada region)</li>
              <li>Data is encrypted in transit and at rest</li>
              <li>Access is restricted to authorized personnel only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Limitations</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>The system does not substitute professional clinical evaluation</li>
              <li>Results must be interpreted by qualified professionals</li>
              <li>Absolute accuracy is not guaranteed in all situations</li>
              <li>Constant human supervision is required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Only for authorized healthcare professionals</li>
              <li>In appropriate clinical environments</li>
              <li>For assistance and documentation purposes</li>
              <li>Respecting patient confidentiality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Compliance</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">PHIPA Compliance (Ontario, Canada)</h3>
              <p className="text-green-800">
                AiduxCare complies with the Personal Health Information Protection Act, 2004 (PHIPA) for Ontario patients. All third-party processors are disclosed as required by PHIPA Section 18.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">PIPEDA Compliance (Canada)</h3>
              <p className="text-purple-800">
                AiduxCare complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) for cross-border data transfers. Patients are informed of all third-party processors and data processing locations.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-700 mb-4">We may suspend or terminate your access if:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You violate these terms</li>
              <li>You use the system inappropriately</li>
              <li>You compromise system security</li>
              <li>You fail to maintain professional standards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-700 mb-4">For questions about these terms of service, contact us:</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@aiduxcare.com<br />
                <strong>Compliance:</strong> compliance@aiduxcare.com<br />
                <strong>Address:</strong> AiduxCare Inc., Niagara Falls Innovation Hub, 4255 Queen St, Niagara Falls, ON L2E 2L3, Canada
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);

// ─── Route entry point ─────────────────────────────────────────────────────────
const TermsOfServicePage: React.FC = () =>
  isSpainPilot() ? <TermsOfServiceSpain /> : <TermsOfServiceCanada />;

export default TermsOfServicePage;
