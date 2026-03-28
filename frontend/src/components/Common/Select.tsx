import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder,
  name,
  value,
  onChange,
  options,
  helperText,
  error,
  disabled = false,
  className = '',
}) => {
  const generatedId = React.useId();
  const selectId = name || generatedId;
  const descriptionId = helperText && !error ? `${selectId}-helper` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-[#F7F7F7]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={errorId ?? descriptionId}
        aria-invalid={!!error}
        className={`theme-input w-full rounded-[1rem] border ${
          error
            ? 'border-[#ff8fbe] focus:border-[#ff8fbe] focus:ring-[#ff8fbe]/30'
            : 'border-white/10 focus:border-[#8ef7c7]/55 focus:ring-[#cab8ff]/25'
        } px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 focus:outline-none focus:ring-2 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${className}`}
      >
        {placeholder && (
          <option value="" className="theme-select-option">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="theme-select-option"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-[#FF6B00]">{error}</p>
      )}
      {helperText && !error && (
        <p id={descriptionId} className="mt-1.5 text-xs text-[#a0a0a0]">{helperText}</p>
      )}
    </div>
  );
};
