import React from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = props.id ?? generatedId;
    const descriptionId = helperText && !error ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#F7F7F7]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={errorId ?? descriptionId}
          aria-invalid={!!error}
          className={cn(
            'theme-input flex h-12 w-full rounded-[1rem] border px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-[#ff8fbe] focus:border-[#ff8fbe] focus:ring-[#ff8fbe]/20',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-sm text-[#FF6B00]">{error}</p>}
        {helperText && !error && <p id={descriptionId} className="text-sm text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
