// @ts-nocheck
import React, { useState } from 'react';

type FloatingAssistantProps = Record<string, unknown>;

export const FloatingAssistant: React.FC<FloatingAssistantProps> = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-in-500 hover:bg-brand-in-600 rounded-full shadow-soft transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-in-300 focus:ring-offset-2"
        aria-label="Abrir asistente AiDux"
      >
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-white font-bold text-lg">A</span>
        </div>
      </button>

      {/* Panel emergente (placeholder para futuras funcionalidades) */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-xl shadow-soft border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">AiDux Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-in-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-in-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-slate-600 text-sm">
                Asistente en desarrollo
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Próximo sprint
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};