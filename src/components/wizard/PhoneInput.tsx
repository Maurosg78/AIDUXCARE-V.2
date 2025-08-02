import React, { useState } from 'react';
import '../../styles/phone-input.css';

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
  { code: '+1', flag: '🇨🇦', name: 'Canadá', format: '(XXX) XXX-XXXX' },
  { code: '+33', flag: '🇫🇷', name: 'Francia', format: 'XX XX XX XX XX' },
  { code: '+49', flag: '🇩🇪', name: 'Alemania', format: 'XXX XXXXXXX' },
  { code: '+39', flag: '🇮🇹', name: 'Italia', format: 'XXX XXXXXXX' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido', format: 'XXXX XXXXXX' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal', format: 'XXX XXX XXX' },
  { code: '+52', flag: '🇲🇽', name: 'México', format: 'XXX XXX XXXX' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', format: 'XXX XXX XXXX' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil', format: 'XX XXXXX XXXX' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', format: 'X XXXX XXXX' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', format: 'XXX XXX XXXX' },
  { code: '+51', flag: '🇵🇪', name: 'Perú', format: 'XXX XXX XXX' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela', format: 'XXX XXX XXXX' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica', format: 'XXXX XXXX' },
  { code: '+86', flag: '🇨🇳', name: 'China', format: 'XXX XXXX XXXX' },
  { code: '+81', flag: '🇯🇵', name: 'Japón', format: 'XX XXXX XXXX' },
  { code: '+82', flag: '🇰🇷', name: 'Corea del Sur', format: 'XX XXXX XXXX' },
  { code: '+91', flag: '🇮🇳', name: 'India', format: 'XXXXX XXXXX' },
  { code: '+61', flag: '🇦🇺', name: 'Australia', format: 'XXX XXX XXX' },
  { code: '+7', flag: '🇷🇺', name: 'Rusia', format: 'XXX XXX XX XX' },
  { code: '+47', flag: '🇳🇴', name: 'Noruega', format: 'XXX XX XXX' },
  { code: '+46', flag: '🇸🇪', name: 'Suecia', format: 'XX XXX XXXX' },
  { code: '+45', flag: '🇩🇰', name: 'Dinamarca', format: 'XX XX XX XX' },
  { code: '+31', flag: '🇳🇱', name: 'Países Bajos', format: 'XX XXX XXXX' },
  { code: '+32', flag: '🇧🇪', name: 'Bélgica', format: 'XXX XXX XXX' },
  { code: '+41', flag: '🇨🇭', name: 'Suiza', format: 'XX XXX XXXX' },
  { code: '+43', flag: '🇦🇹', name: 'Austria', format: 'XXX XXX XXX' },
  { code: '+420', flag: '🇨🇿', name: 'República Checa', format: 'XXX XXX XXX' },
  { code: '+48', flag: '🇵🇱', name: 'Polonia', format: 'XXX XXX XXX' },
];

const PHONE_REGEX = {
  '+34': /^[6-9]\d{8}$/, // España
  '+1': /^\d{10}$/,      // USA/Canadá
  '+33': /^[1-9]\d{8}$/, // Francia
  '+49': /^\d{10,11}$/,  // Alemania
  '+39': /^\d{10}$/,     // Italia
  '+44': /^\d{10,11}$/,  // Reino Unido
  '+351': /^\d{9}$/,     // Portugal
  '+52': /^\d{10}$/,     // México
  '+54': /^\d{10}$/,     // Argentina
  '+55': /^\d{11}$/,     // Brasil
  '+56': /^\d{9}$/,      // Chile
  '+57': /^\d{10}$/,     // Colombia
  '+51': /^\d{9}$/,      // Perú
  '+58': /^\d{10}$/,     // Venezuela
  '+506': /^\d{8}$/,     // Costa Rica
  '+86': /^\d{11}$/,     // China
  '+81': /^\d{10}$/,     // Japón
  '+82': /^\d{10}$/,     // Corea del Sur
  '+91': /^\d{10}$/,     // India
  '+61': /^\d{9}$/,      // Australia
  '+7': /^\d{10}$/,      // Rusia
  '+47': /^\d{8}$/,      // Noruega
  '+46': /^\d{9}$/,      // Suecia
  '+45': /^\d{8}$/,      // Dinamarca
  '+31': /^\d{9}$/,      // Países Bajos
  '+32': /^\d{9}$/,      // Bélgica
  '+41': /^\d{9}$/,      // Suiza
  '+43': /^\d{9}$/,      // Austria
  '+420': /^\d{9}$/,     // República Checa
  '+48': /^\d{9}$/,      // Polonia
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
      case '+49':
        // Formato: XXX XXXXXXX
        return cleaned.replace(/(\d{3})(\d{7})/, '$1 $2');
      case '+39':
        // Formato: XXX XXXXXXX
        return cleaned.replace(/(\d{3})(\d{7})/, '$1 $2');
      case '+44':
        // Formato: XXXX XXXXXX
        return cleaned.replace(/(\d{4})(\d{6})/, '$1 $2');
      case '+351':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+52':
        // Formato: XXX XXX XXXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+54':
        // Formato: XXX XXX XXXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+55':
        // Formato: XX XXXXX XXXX
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '$1 $2 $3');
      case '+56':
        // Formato: X XXXX XXXX
        return cleaned.replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2 $3');
      case '+57':
        // Formato: XXX XXX XXXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+51':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+58':
        // Formato: XXX XXX XXXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+506':
        // Formato: XXXX XXXX
        return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
      case '+86':
        // Formato: XXX XXXX XXXX
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
      case '+81':
        // Formato: XX XXXX XXXX
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
      case '+82':
        // Formato: XX XXXX XXXX
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
      case '+91':
        // Formato: XXXXX XXXXX
        return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
      case '+61':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+7':
        // Formato: XXX XXX XX XX
        return cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      case '+47':
        // Formato: XXX XX XXX
        return cleaned.replace(/(\d{3})(\d{2})(\d{3})/, '$1 $2 $3');
      case '+46':
        // Formato: XX XXX XXXX
        return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+45':
        // Formato: XX XX XX XX
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      case '+31':
        // Formato: XX XXX XXXX
        return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+32':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+41':
        // Formato: XX XXX XXXX
        return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+43':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+420':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+48':
        // Formato: XXX XXX XXX
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
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
    <div className="phone-input-container">
      {/* Selector de país - SIN SUPERPOSICIÓN */}
      <select
        value={selectedCountry.code}
        onChange={(e) => handleCountryChange(e.target.value)}
        className="country-code-select"
        aria-label="Código de país"
      >
        {COUNTRY_CODES.map((country) => (
          <option key={`${country.code}-${country.name}`} value={country.code}>
            {country.flag} {country.code}
          </option>
        ))}
      </select>
      
      {/* Input de teléfono - SIN SUPERPOSICIÓN */}
      <input
        type="tel"
        value={value}
        onChange={handlePhoneChange}
        className={`phone-number-input ${error || !isValid ? 'border-red-300' : ''}`}
        placeholder={placeholder || selectedCountry.format}
        autoComplete="tel"
        aria-label="Número de teléfono"
      />
    </div>
  );
}; 