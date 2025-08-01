/**
 * @fileoverview Componente FormField enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import { FormFieldProps } from '@/types/wizard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { SelectOption } from '@/components/ui/Select';

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  autoComplete,
  ariaLabel,
  ariaDescribedBy
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const commonProps = {
    id: `field-${name}`,
    value: value || '',
    onChange: handleChange,
    error,
    required,
    disabled,
    'aria-label': ariaLabel || label,
    'aria-describedby': ariaDescribedBy
  };

  if (type === 'select') {
    const selectOptions: SelectOption[] = options.length > 0 ? options : [
      { value: '', label: 'Selecciona una opción' },
      ...options
    ];

    return (
      <Select
        {...commonProps}
        label={label}
        options={selectOptions}
        placeholder={placeholder}
        fullWidth
      />
    );
  }

  return (
    <Input
      {...commonProps}
      type={type}
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      fullWidth
    />
  );
};

export default FormField; 