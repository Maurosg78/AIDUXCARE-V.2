
const MFAGuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Guía de Configuración MFA - AiDuxCare
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <strong>🔐 Autenticación Multi-Factor (MFA)</strong> agrega una capa adicional de seguridad a tu cuenta 
                AiDuxCare, protegiendo tus datos clínicos y la información de tus pacientes.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">¿Qué es MFA?</h2>
              <p className="text-gray-700 mb-4">
                La autenticación multi-factor requiere dos o más métodos de verificación para acceder a tu cuenta:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Algo que sabes:</strong> Tu contraseña</li>
                <li><strong>Algo que tienes:</strong> Tu dispositivo móvil con una app autenticadora</li>
                <li><strong>Algo que eres:</strong> Tu huella dactilar o reconocimiento facial (opcional)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Apps Autenticadoras Recomendadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Google Authenticator</h3>
                  <p className="text-sm text-gray-600 mb-2">Gratuita y fácil de usar</p>
                  <div className="flex space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">iOS</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Android</span>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Microsoft Authenticator</h3>
                  <p className="text-sm text-gray-600 mb-2">Integración con Microsoft 365</p>
                  <div className="flex space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">iOS</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Android</span>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Authy</h3>
                  <p className="text-sm text-gray-600 mb-2">Sincronización en la nube</p>
                  <div className="flex space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">iOS</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Android</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pasos para Configurar MFA</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paso 1: Accede a tu Perfil</h3>
                  <p className="text-gray-700">
                    Ve a tu perfil de usuario en AiDuxCare y busca la sección &ldquo;Seguridad&rdquo; o &ldquo;Autenticación Multi-Factor&rdquo;.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paso 2: Escanea el Código QR</h3>
                  <p className="text-gray-700">
                    Abre tu app autenticadora y escanea el código QR que aparece en la pantalla. 
                    Esto vinculará tu dispositivo con tu cuenta AiDuxCare.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paso 3: Verifica la Configuración</h3>
                  <p className="text-gray-700">
                    Introduce el código de 6 dígitos que aparece en tu app autenticadora para verificar 
                    que la configuración es correcta.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paso 4: Guarda los Códigos de Respaldo</h3>
                  <p className="text-gray-700">
                    Guarda en un lugar seguro los códigos de respaldo que te proporcionamos. 
                    Estos te permitirán acceder a tu cuenta si pierdes tu dispositivo.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Códigos de Respaldo</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Importante</h3>
                <p className="text-yellow-800 mb-4">
                  Los códigos de respaldo son tu última línea de defensa si pierdes acceso a tu dispositivo. 
                  Guárdalos en un lugar seguro y nunca los compartas.
                </p>
                <div className="bg-white border border-yellow-300 rounded p-3">
                  <p className="text-sm text-gray-700 font-mono">
                    Ejemplo de códigos de respaldo:<br/>
                    • 1234567890123456<br/>
                    • 2345678901234567<br/>
                    • 3456789012345678<br/>
                    • 4567890123456789<br/>
                    • 5678901234567890
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Desactivar MFA</h2>
              <p className="text-gray-700 mb-4">
                Si necesitas desactivar MFA temporalmente:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 mb-4">
                <li>Accede a tu perfil de usuario</li>
                <li>Ve a la sección &ldquo;Seguridad&rdquo;</li>
                <li>Haz clic en &ldquo;Desactivar MFA&rdquo;</li>
                <li>Confirma tu contraseña</li>
                <li>Introduce un código de respaldo para verificar</li>
              </ol>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  <strong>⚠️ Advertencia:</strong> Desactivar MFA reduce la seguridad de tu cuenta. 
                  Solo hazlo si es absolutamente necesario.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Soporte Técnico</h2>
              <p className="text-gray-700 mb-4">
                Si tienes problemas con la configuración de MFA:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@aiduxcare.com<br/>
                  <strong>Teléfono:</strong> +34 900 123 456<br/>
                  <strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00 (CET)
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAGuidePage; 