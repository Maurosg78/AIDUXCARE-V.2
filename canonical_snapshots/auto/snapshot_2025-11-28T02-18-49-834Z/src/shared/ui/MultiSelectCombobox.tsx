import React, { useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label: string };

export interface MultiSelectComboboxProps {
  label: string;
  placeholder?: string;
  options: Option[];
  value: string[];                     // valores seleccionados (por label)
  onChange: (values: string[]) => void;
  maxItems?: number;
  allowCustom?: boolean;               // permitir entrada libre
  className?: string;
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
  label,
  placeholder = 'Escribe para buscar…',
  options,
  value,
  onChange,
  maxItems = 12,
  allowCustom = true,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const base = options.filter(o =>
      o.label.toLowerCase().includes(q) && !value.includes(o.label)
    );
    if (allowCustom && q && !options.some(o => o.label.toLowerCase() === q) && !value.includes(query)) {
      return [...base, { value: `__custom__:${query}`, label: `Añadir “${query}”` }];
    }
    return base;
  }, [q, options, value, allowCustom, query]);

  const add = (labelToAdd: string) => {
    if (!labelToAdd) return;
    if (value.includes(labelToAdd)) return;
    if (value.length >= maxItems) return;
    onChange([...value, labelToAdd]);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (labelToRemove: string) => {
    onChange(value.filter(v => v !== labelToRemove));
    inputRef.current?.focus();
  };

  const handleOptionClick = (opt: Option) => {
    if (opt.value.startsWith('__custom__:')) {
      add(opt.value.replace('__custom__:', ''));
    } else {
      add(opt.label);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && query) {
      e.preventDefault();
      if (allowCustom) add(query);
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value[value.length - 1]);
    }
  };

  useEffect(() => {
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-slate-700">{label}
        <span className="ml-2 text-slate-400">({value.length}/{maxItems})</span>
      </label>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-in-end">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-in-50 text-in-start border border-in-start/30 px-2.5 py-1 text-sm">
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="ml-1 text-in-end hover:opacity-80"
                aria-label={`Eliminar ${v}`}
              >×</button>
            </span>
          ))}

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length >= maxItems ? '' : placeholder}
            className="flex-1 min-w-[140px] outline-none text-sm"
          />
        </div>

        {open && filtered.length > 0 && (
          <div
            role="listbox"
            className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto"
          >
            {filtered.map((opt) => (
              <button
                key={opt.value + opt.label}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


