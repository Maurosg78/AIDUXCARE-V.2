/**
 * Custom Select Component
 * 
 * Soluciona problemas de visibilidad de los selects nativos HTML
 * usando un dropdown personalizado con posicionamiento absoluto
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  className = '',
  style,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Calcular posición del dropdown usando getBoundingClientRect
  useEffect(() => {
    if (isOpen && selectRef.current) {
      // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
      const updatePosition = () => {
        if (!selectRef.current) return;
        
        const rect = selectRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 240; // max-h-60 = 240px

        // Calcular posición: abajo si hay espacio, arriba si no
        const openDownward = spaceBelow >= dropdownHeight || spaceBelow > spaceAbove;
        
        setDropdownPosition({
          top: openDownward ? rect.bottom + window.scrollY + 4 : rect.top + window.scrollY - dropdownHeight - 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      };

      // Calcular posición inmediatamente
      updatePosition();
      
      // También recalcular en el siguiente frame por si acaso
      requestAnimationFrame(updatePosition);
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // No cerrar si el click es en el select o en el dropdown
      if (
        selectRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      // Usar 'click' en lugar de 'mousedown' para mejor compatibilidad
      document.addEventListener('click', handleClickOutside, true);
      return () => document.removeEventListener('click', handleClickOutside, true);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div 
      ref={selectRef} 
      className={`relative ${className}`} 
      style={{
        ...style,
        // Asegurar que el contenedor tenga su propio contexto de apilamiento
        isolation: 'isolate',
        zIndex: isOpen ? 1000 : 'auto',
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full h-9 px-4 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light flex items-center justify-between ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-primary-blue border-primary-blue' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop para cerrar al hacer click fuera - solo captura clicks fuera del dropdown */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              // Solo cerrar si el click NO es en el select ni en el dropdown
              const target = e.target as Node;
              if (
                selectRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
              ) {
                return;
              }
              setIsOpen(false);
            }}
            style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
            aria-hidden="true"
          />
          {/* Dropdown menu - renderizado en portal para evitar superposiciones */}
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto"
            role="listbox"
            onClick={(e) => {
              // Prevenir que el click se propague al backdrop
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Prevenir que el mousedown se propague al backdrop
              e.stopPropagation();
            }}
            style={{
              ...(dropdownPosition ? {
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              } : {
                // Fallback: posición relativa al botón si aún no se calculó
                top: '100%',
                left: 0,
                width: '100%',
                position: 'absolute',
              }),
              pointerEvents: 'auto',
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2 text-left text-[15px] font-apple font-light flex items-center justify-between hover:bg-gray-50 focus:bg-gray-50 transition-colors ${
                  value === option.value ? 'bg-blue-50 text-primary-blue' : 'text-gray-900'
                }`}
                role="option"
                aria-selected={value === option.value}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <CheckIcon className="w-4 h-4 text-primary-blue" />
                )}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {error && (
        <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{error}</p>
      )}
    </div>
  );
};

