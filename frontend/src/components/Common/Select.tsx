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
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-[#F7F7F7]">
          {label}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border ${
          error
            ? 'border-[#FF6B00] focus:border-[#FF6B00] focus:ring-[#FF6B00]'
            : 'border-[#2e303a] focus:border-[#00FF88] focus:ring-[#00FF88]'
        } bg-[#1a1a2e] px-4 py-2.5 text-[#F7F7F7] transition-all focus:outline-none focus:ring-1 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-[#FF6B00]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-[#a0a0a0]">{helperText}</p>
      )}
    </div>
  );
};
