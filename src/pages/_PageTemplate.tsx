import React from 'react';

interface PageTemplateProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageTemplate({ title, subtitle, children }: PageTemplateProps) {
  return (
    <div className="page-container">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      
      <div className="content-card">
        {children || (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-brand-in-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-in-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="placeholder-text text-lg mb-2">Módulo en construcción</p>
            <p className="text-slate-400">Próximo sprint</p>
          </div>
        )}
      </div>
    </div>
  );
}
