// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';

export interface TokenInputProps {
  label: string;
  placeholder?: string;
  suggestions?: string[];
  value: string[];
  onChange: (tokens: string[]) => void;
  maxTokens?: number;
  className?: string;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  label,
  placeholder = 'Escribe y presiona Enter...',
  suggestions = [],
  value = [],
  onChange,
  maxTokens = 10,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions.filter(
        suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(suggestion)
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, suggestions, value]);

  const addToken = (token: string) => {
    const trimmedToken = token.trim();
    if (trimmedToken && !value.includes(trimmedToken) && value.length < maxTokens) {
      onChange([...value, trimmedToken]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeToken = (tokenToRemove: string) => {
    onChange(value.filter(token => token !== tokenToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addToken(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeToken(value[value.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addToken(suggestion);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {maxTokens && (
          <span className="text-slate-500 ml-2">
            ({value.length}/{maxTokens})
          </span>
        )}
      </label>
      
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-3 border border-slate-300 rounded-lg bg-white min-h-[44px] focus-within:ring-2 focus-within:ring-brand-in-500 focus-within:border-brand-in-500">
          {value.map((token, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-in-100 text-brand-in-700 text-sm rounded-full"
            >
              {token}
              <button
                type="button"
                onClick={() => removeToken(token)}
                className="ml-1 text-brand-in-600 hover:text-brand-in-800 focus:outline-none"
                aria-label={`Eliminar ${token}`}
              >
                ×
              </button>
            </span>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length < maxTokens ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none text-sm"
            disabled={value.length >= maxTokens}
          />
        </div>

        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};