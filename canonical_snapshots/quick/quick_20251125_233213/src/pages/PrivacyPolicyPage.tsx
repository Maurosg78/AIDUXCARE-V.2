import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Política de Privacidad - AiDuxCare
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-700 mb-4">
                Recopilamos información que usted nos proporciona directamente, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Información de identificación personal (nombre, email, número de licencia profesional)</li>
                <li>Información profesional (especialidad, años de experiencia)</li>
                <li>Datos de sesiones clínicas y transcripciones de audio</li>
                <li>Información de cumplimiento normativo (GDPR, HIPAA)</li>
              </ul>
            </section>

            <section id="data-usage" className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cómo Utilizamos su Información</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Proporcionar y mejorar nuestros servicios de asistencia clínica</li>
                <li>Generar documentación SOAP automática</li>
                <li>Cumplir con obligaciones legales y normativas</li>
                <li>Comunicarnos con usted sobre su cuenta y servicios</li>
                <li>Garantizar la seguridad y prevenir fraudes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cumplimiento Normativo</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">GDPR - Reglamento General de Protección de Datos</h3>
                <p className="text-blue-800">
                  Cumplimos con el GDPR para usuarios de la Unión Europea. Usted tiene derecho a:
                </p>
                <ul className="list-disc pl-6 text-blue-800 mt-2">
                  <li>Acceder a sus datos personales</li>
                  <li>Rectificar información inexacta</li>
                  <li>Solicitar la eliminación de sus datos</li>
                  <li>Portabilidad de datos</li>
                  <li>Oponerse al procesamiento</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">HIPAA - Ley de Portabilidad y Responsabilidad de Seguros Médicos</h3>
                <p className="text-green-800">
                  Para usuarios en Estados Unidos, cumplimos con HIPAA para la protección de información de salud.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Seguridad de Datos</h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Autenticación multi-factor (MFA)</li>
                <li>Auditoría completa de accesos</li>
                <li>Copias de seguridad seguras</li>
                <li>Monitoreo continuo de seguridad</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para preguntas sobre esta política de privacidad o para ejercer sus derechos, contáctenos:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@aiduxcare.com<br/>
                  <strong>Teléfono:</strong> +34 900 123 456<br/>
                  <strong>Dirección:</strong> Calle de la Innovación 123, 28001 Madrid, España
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 