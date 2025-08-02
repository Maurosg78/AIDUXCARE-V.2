/**
 * 🏛️ Legal Checklist Component - AiDuxCare V.2
 * Componente para checklist legal completo de uso de AiDuxCare
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState } from 'react';

export interface LegalChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  category: 'terms' | 'privacy' | 'medical' | 'compliance' | 'security';
  checked: boolean;
  termsContent?: string;
}

export interface LegalChecklistProps {
  items: LegalChecklistItem[];
  onItemChange: (itemId: string, checked: boolean) => void;
  onComplete: (allChecked: boolean) => void;
  showDetails?: boolean;
}

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {content}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LegalChecklist: React.FC<LegalChecklistProps> = ({
  items,
  onItemChange,
  onComplete
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: '',
    content: ''
  });

  const handleItemChange = (itemId: string, checked: boolean) => {
    onItemChange(itemId, checked);
    
    // Verificar si todos los items requeridos están marcados
    const requiredItems = items.filter(item => item.required);
    const checkedRequiredItems = requiredItems.filter(item => 
      item.id === itemId ? checked : item.checked
    );
    
    onComplete(checkedRequiredItems.length === requiredItems.length);
  };

  const openTermsModal = (title: string, content: string) => {
    setModalState({
      isOpen: true,
      title,
      content
    });
  };

  const closeTermsModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      content: ''
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'terms':
        return '📋';
      case 'privacy':
        return '🔒';
      case 'medical':
        return '🏥';
      default:
        return '📝';
    }
  };

  const getTermsContent = (itemId: string) => {
    switch (itemId) {
      case 'terms-accepted':
        return `TÉRMINOS Y CONDICIONES DE USO - AiDuxCare

1. PROPÓSITO DEL SISTEMA
AiDuxCare es un copiloto clínico inteligente diseñado para asistir a profesionales de la salud, no para reemplazarlos. El sistema proporciona:
• Asistencia en documentación clínica mediante IA
• Generación de notas SOAP estructuradas
• Detección de banderas rojas y contraindicaciones
• Optimización del flujo de trabajo clínico

2. RESPONSABILIDADES DEL PROFESIONAL
Al usar AiDuxCare, usted acepta:
• Mantener el juicio clínico independiente
• Revisar y validar todas las sugerencias del sistema
• Asumir la responsabilidad final por todas las decisiones clínicas
• No delegar decisiones críticas al sistema de IA

3. LIMITACIONES DEL SERVICIO
• El sistema no sustituye la evaluación clínica profesional
• Los resultados deben ser interpretados por profesionales cualificados
• No garantiza la precisión absoluta en todas las situaciones
• Requiere supervisión humana constante

4. USO ACEPTABLE
• Solo para profesionales de la salud autorizados
• En entornos clínicos apropiados
• Con fines de asistencia y documentación
• Respetando la confidencialidad del paciente

5. TERMINACIÓN
Podemos suspender o terminar su acceso si:
• Viola estos términos
• Usa el sistema de manera inapropiada
• Compromete la seguridad del sistema`;

      case 'privacy-accepted':
        return `POLÍTICA DE PRIVACIDAD Y SEGURIDAD - AiDuxCare

1. PROTECCIÓN DE DATOS MÉDICOS
• Cumplimiento con HIPAA (EE.UU.) y GDPR (UE)
• Cifrado end-to-end de todos los datos clínicos
• Almacenamiento seguro en servidores certificados
• Acceso restringido solo a personal autorizado

2. RECOPILACIÓN DE DATOS
Recopilamos únicamente:
• Información de contacto profesional
• Datos de sesión clínica (con consentimiento)
• Métricas de uso del sistema
• Información técnica para soporte

3. USO DE DATOS
Los datos se utilizan exclusivamente para:
• Proporcionar servicios clínicos
• Mejorar la funcionalidad del sistema
• Cumplir obligaciones legales
• Mantener la seguridad del sistema

4. COMPARTIR DATOS
No compartimos datos con terceros excepto:
• Cuando es legalmente requerido
• Con su consentimiento explícito
• Para servicios técnicos esenciales (con garantías)

5. SUS DERECHOS
Usted tiene derecho a:
• Acceder a sus datos personales
• Solicitar corrección de datos inexactos
• Solicitar eliminación de datos
• Portabilidad de datos
• Oposición al procesamiento

6. SEGURIDAD
Implementamos:
• Cifrado AES-256 para datos en tránsito y reposo
• Autenticación multifactor (MFA)
• Auditoría completa de accesos
• Copias de seguridad seguras
• Monitoreo 24/7 de seguridad

7. RETENCIÓN DE DATOS
• Datos clínicos: Según normativa local (mínimo 7 años)
• Datos de cuenta: Mientras mantenga la cuenta activa
• Datos de auditoría: 10 años para cumplimiento legal`;

      case 'medical-disclaimer':
        return `DESCARGO DE RESPONSABILIDAD MÉDICA - AiDuxCare

1. NATURALEZA DEL SISTEMA
AiDuxCare es una herramienta de asistencia clínica que:
• NO sustituye la evaluación médica profesional
• NO proporciona diagnósticos definitivos
• NO reemplaza la experiencia clínica
• NO garantiza resultados específicos

2. LIMITACIONES CLÍNICAS
El sistema tiene limitaciones inherentes:
• Puede no detectar todas las condiciones
• Puede generar falsos positivos/negativos
• Requiere interpretación clínica experta
• No considera todos los factores individuales

3. RESPONSABILIDAD PROFESIONAL
Usted es responsable de:
• Todas las decisiones clínicas finales
• La interpretación correcta de las sugerencias
• La validación de todos los resultados
• El cumplimiento de estándares de práctica

4. CASOS DE USO APROPIADOS
El sistema es apropiado para:
• Asistencia en documentación clínica
• Identificación de posibles banderas rojas
• Optimización de flujos de trabajo
• Referencias educativas

5. CASOS DE USO INAPROPIADOS
NO use el sistema para:
• Diagnósticos definitivos sin evaluación
• Decisiones críticas sin supervisión
• Sustituir consultas médicas urgentes
• Emergencias médicas

6. ADVERTENCIAS ESPECÍFICAS
• Siempre verifique la información del paciente
• Considere el contexto clínico completo
• Mantenga la supervisión humana constante
• Documente su juicio clínico independiente

7. ACUERDO DE USO
Al usar AiDuxCare, usted:
• Reconoce estas limitaciones
• Acepta la responsabilidad clínica total
• Se compromete a usar el sistema apropiadamente
• Entiende que es una herramienta de asistencia`;

      default:
        return 'Contenido no disponible';
    }
  };

  const requiredItems = items.filter(item => item.required);
  const checkedRequiredItems = requiredItems.filter(item => item.checked);
  const progressPercentage = requiredItems.length > 0 
    ? (checkedRequiredItems.length / requiredItems.length) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header simplificado */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Consentimientos Legales Requeridos
          </h3>
          <div className="text-sm text-gray-600">
            {checkedRequiredItems.length} de {requiredItems.length} completados
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600">
          Debe aceptar los 3 consentimientos para continuar
        </p>
      </div>

      {/* Checklist simplificado con links */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={item.id}
                checked={item.checked}
                onChange={(e) => handleItemChange(item.id, e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required={item.required}
              />
              <div className="flex-1">
                <label 
                  htmlFor={item.id} 
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{getCategoryIcon(item.category)}</span>
                    <span className="font-medium text-gray-900">
                      {item.title}
                    </span>
                    {item.required && (
                      <span className="text-red-500 text-xs font-medium">*</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {item.description}
                  </p>
                  
                  {/* Link para ver términos */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openTermsModal(item.title, getTermsContent(item.id));
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    📄 Leer términos completos
                  </button>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen simplificado */}
      {progressPercentage === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <p className="text-green-800 font-medium">
              Todos los consentimientos han sido aceptados
            </p>
          </div>
        </div>
      )}

      {/* Modal de términos */}
      <TermsModal
        isOpen={modalState.isOpen}
        onClose={closeTermsModal}
        title={modalState.title}
        content={modalState.content}
      />
    </div>
  );
}; 