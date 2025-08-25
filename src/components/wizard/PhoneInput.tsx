import React from "react";
/* eslint-disable react/prop-types */
import { useCallback } from 'react';

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (phone: string) => void;
  onCountryChange: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  countryCode,
  onChange,
  onCountryChange,
  error,
  disabled = false
}) => {
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, ''); // Solo números
    onChange(phone);
  }, [onChange]);

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onCountryChange(e.target.value);
  }, [onCountryChange]);

  return (
    <div className="space-y-2">
      <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700">
        Teléfono *
      </label>
      
      <div className="flex gap-3">
        {/* Código de país - proporción más equilibrada */}
        <select
          id="country-code-select"
          value={countryCode}
          onChange={handleCountryChange}
          disabled={disabled}
          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-center font-medium"
        >
          <option value="+34">+34</option>
          <option value="+1">+1</option>
          <option value="+44">+44</option>
          <option value="+33">+33</option>
          <option value="+49">+49</option>
          <option value="+39">+39</option>
          <option value="+31">+31</option>
          <option value="+32">+32</option>
          <option value="+351">+351</option>
          <option value="+34">+34</option>
        </select>
        
        {/* Campo del número - proporción más equilibrada */}
        <input
          id="phone-input"
          type="tel"
          value={value || ''}
          onChange={handlePhoneChange}
          disabled={disabled}
          className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          placeholder="XXX XXX XXX"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Solo números, sin espacios ni caracteres especiales
      </p>
    </div>
  );
};
