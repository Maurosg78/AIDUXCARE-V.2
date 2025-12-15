/**
 * 🏛️ Legal Checklist Component - AiDuxCare V.2
 * Componente para checklist legal completo de uso de AiDuxCare
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState } from 'react';
import '../styles/legal-checklist.css';
import { LegalModal } from './legal/LegalModal';
import { PrivacyContent, TermsContent, PHIPAPIPEDAContent, LAST_UPDATED } from './legal/legalContent';

export interface LegalChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  category: 'terms' | 'privacy' | 'medical' | 'compliance' | 'security' | 'phipa-pipeda';
  checked: boolean;
  termsContent?: string;
}

export interface LegalChecklistProps {
  items: LegalChecklistItem[];
  onItemChange: (itemId: string, checked: boolean) => void;
  onComplete: (allChecked: boolean) => void;
  showDetails?: boolean;
}

export const LegalChecklist: React.FC<LegalChecklistProps> = ({
  items,
  onItemChange,
  onComplete
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode | null;
  }>({
    isOpen: false,
    title: '',
    content: null
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

  const openTermsModal = (title: string, itemId: string) => {
    let content: React.ReactNode | null = null;
    
    switch (itemId) {
      case 'terms-accepted':
        content = <TermsContent />;
        break;
      case 'privacy-accepted':
        content = <PrivacyContent />;
        break;
      case 'phipa-pipeda-accepted':
        content = <PHIPAPIPEDAContent />;
        break;
      default:
        content = <p>Content not available.</p>;
    }
    
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
      content: null
    });
  };

  const requiredItems = items.filter(item => item.required);
  const checkedRequiredItems = requiredItems.filter(item => item.checked);
  const progressPercentage = requiredItems.length > 0 
    ? (checkedRequiredItems.length / requiredItems.length) * 100 
    : 0;

  return (
    <div className="legal-checklist-container">
      {/* Header ultra-compacto */}
      <div className="legal-checklist-header">
        <div className="legal-checklist-progress">
          <h3 className="legal-checklist-title">
            Consentimientos Legales Requeridos
          </h3>
          <div className="legal-checklist-progress-text">
            {checkedRequiredItems.length} de {requiredItems.length} completados
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="legal-checklist-progress-bar">
          <div 
            className="legal-checklist-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <p className="legal-checklist-instruction">
          Debe aceptar los 3 consentimientos para continuar
        </p>
      </div>

      {/* Checklist ultra-compacto */}
      <div className="legal-checklist-items">
        {items.map((item) => (
          <div key={item.id} className="legal-checklist-item">
            <div className="legal-checklist-item-content">
              <input
                type="checkbox"
                id={item.id}
                checked={item.checked}
                onChange={(e) => handleItemChange(item.id, e.target.checked)}
                className="legal-checklist-checkbox"
                required={item.required}
                style={{
                  width: '16px',
                  height: '16px',
                  margin: '0 8px 0 0',
                  cursor: 'pointer',
                  accentColor: '#2563eb'
                }}
              />
              <div className="legal-checklist-label">
                <div className="legal-checklist-item-header">
                  <span className="legal-checklist-category-icon"></span>
                  <span className="legal-checklist-item-title">
                    {item.title}
                  </span>
                  {item.required && (
                    <span className="legal-checklist-required">*</span>
                  )}
                </div>
                
                <p className="legal-checklist-description">
                  {item.description}
                </p>
                
                {/* Link para ver términos */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openTermsModal(item.title, item.id);
                  }}
                  className="legal-checklist-terms-link"
                >
                  Read full terms
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen ultra-compacto */}
      {progressPercentage === 100 && (
        <div className="legal-checklist-success">
          <div className="legal-checklist-success-content">
            <span className="legal-checklist-success-icon"></span>
            <p className="legal-checklist-success-text">
              Todos los consentimientos han sido aceptados
            </p>
          </div>
        </div>
      )}

      {/* Modal de términos */}
      <LegalModal
        isOpen={modalState.isOpen}
        onClose={closeTermsModal}
        title={modalState.title}
        content={modalState.content}
        lastUpdated={LAST_UPDATED}
      />
    </div>
  );
}; 