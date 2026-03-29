import React from 'react';
import { cn } from '../../lib/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = props.id ?? generatedId;
    const descriptionId = helperText && !error ? `${textareaId}-helper` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="w-full space-y-2">
        {label ? <label htmlFor={textareaId} className="theme-label block text-sm font-medium">{label}</label> : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-describedby={errorId ?? descriptionId}
          aria-invalid={!!error}
          className={cn(
            'theme-input w-full rounded-[1rem] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-[#ff8fbe] focus:border-[#ff8fbe] focus:ring-[#ff8fbe]/20',
            className
          )}
          {...props}
        />
        {error ? <p id={errorId} className="text-sm text-[#FF6B00]">{error}</p> : null}
        {helperText && !error ? <p id={descriptionId} className="theme-copy-muted text-sm">{helperText}</p> : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
