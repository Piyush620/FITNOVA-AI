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

    const isCalendarInput = props.type === 'date' || props.type === 'month';

    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={inputId} className="theme-label block text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={errorId ?? descriptionId}
          aria-invalid={!!error}
          className={cn(
            'theme-input flex h-12 w-full rounded-[1rem] border px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow,background,color] duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
            isCalendarInput && 'theme-calendar-input pr-12',
            error && 'border-[#ff8fbe] focus:border-[#ff8fbe] focus:ring-[#ff8fbe]/20',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-sm text-[#FF6B00]">{error}</p>}
        {helperText && !error && <p id={descriptionId} className="theme-copy-muted text-sm">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
