import React, { useState } from 'react';

interface PhoneCountryCode {
  code: string;
  flag: string;
  name: string;
  format: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
  error?: string;
  placeholder?: string;
}

const COUNTRY_CODES: PhoneCountryCode[] = [
  { code: '+34', flag: '🇪🇸', name: 'España', format: 'XXX XXX XXX' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos', format: '(XXX) XXX-XXXX' },
  { code: '+33', flag: '🇫🇷', name: 'Francia', format: 'XX XX XX XX XX' },
  { code: '+49', flag: '🇩🇪', name: 'Alemania', format: 'XXX XXX XXX' },
  { code: '+39', flag: '🇮🇹', name: 'Italia', format: 'XXX XXX XXX' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido', format: 'XXXX XXXXXX' },
  { code: '+52', flag: '🇲🇽', name: 'México', format: 'XXX XXX XXXX' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', format: 'XXX XXX XXXX' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', format: 'X XXXX XXXX' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', format: 'XXX XXX XXXX' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela', format: 'XXX XXX XXXX' },
  { code: '+51', flag: '🇵🇪', name: 'Perú', format: 'XXX XXX XXX' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador', format: 'XX XXX XXXX' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', format: 'XXX XXX XXX' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay', format: 'XX XXX XXX' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', format: 'XXX XXX XXX' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia', format: 'XXX XXX XXX' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', format: 'XXX XXX XXX' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', format: 'XXX XXX XXX' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', format: 'XXX XXX XXX' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', format: 'XXX XXX XXX' },
];

const PHONE_REGEX = {
  '+34': /^[6-9]\d{8}$/, // España
  '+1': /^\d{10}$/,      // USA/Canadá
  '+33': /^[1-9]\d{8}$/, // Francia
  '+49': /^\d{10,11}$/,  // Alemania
  '+39': /^\d{10}$/,     // Italia
  '+44': /^\d{10,11}$/,  // Reino Unido
  '+52': /^\d{10}$/,     // México
  '+54': /^\d{10}$/,     // Argentina
  '+56': /^\d{9}$/,      // Chile
  '+57': /^\d{10}$/,     // Colombia
  '+58': /^\d{10}$/,     // Venezuela
  '+51': /^\d{9}$/,      // Perú
  '+593': /^\d{9}$/,     // Ecuador
  '+595': /^\d{9}$/,     // Paraguay
  '+598': /^\d{8}$/,     // Uruguay
  '+591': /^\d{8}$/,     // Bolivia
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryCode,
  onCountryChange,
  error,
  placeholder
}) => {
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountryCode>(
    COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0]
  );

  const formatPhone = (value: string, countryCode: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    switch (countryCode) {
      case '+34':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+1':
        // Formato: (XXX) XXX-XXXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      case '+33':
        // Formato: XX XX XX XX XX
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
      default:
        return cleaned;
    }
  };

  const validatePhone = (phone: string, countryCode: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    const regex = PHONE_REGEX[countryCode as keyof typeof PHONE_REGEX];
    return regex ? regex.test(cleaned) : cleaned.length >= 8;
  };

  const handleCountryChange = (newCountryCode: string) => {
    const country = COUNTRY_CODES.find(c => c.code === newCountryCode);
    if (country) {
      setSelectedCountry(country);
      onCountryChange(newCountryCode);
      // Limpiar el teléfono cuando cambia el país
      onChange('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value, selectedCountry.code);
    onChange(formatted);
  };

  const isValid = value ? validatePhone(value, selectedCountry.code) : true;

  return (
    <div className="flex w-full">
      {/* Selector de país */}
      <div className="flex-shrink-0">
        <select
          value={selectedCountry.code}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="h-12 px-3 py-2 border border-gray-200 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 text-sm border-r-0"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
      </div>
      
      {/* Input de teléfono */}
      <input
        type="tel"
        value={value}
        onChange={handlePhoneChange}
        className={`flex-1 h-12 px-3 py-2 border border-gray-200 rounded-r-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm border-l-0 ${error || !isValid ? 'border-red-300' : ''}`}
        placeholder={placeholder || selectedCountry.format}
        autoComplete="tel"
      />
    </div>
  );
}; 