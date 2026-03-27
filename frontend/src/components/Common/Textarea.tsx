import React from 'react';
import { cn } from '../../lib/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', rows = 4, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label ? <label className="block text-sm font-medium text-[#F7F7F7]">{label}</label> : null}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-xl border border-[#2e303a] bg-[#11131d] px-4 py-3 text-[#F7F7F7] placeholder:text-slate-500 transition-colors duration-200 focus:border-[#00FF88] focus:outline-none focus:ring-2 focus:ring-[#00FF88]/20 disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-[#FF6B00] focus:border-[#FF6B00] focus:ring-[#FF6B00]/20',
            className
          )}
          {...props}
        />
        {error ? <p className="text-sm text-[#FF6B00]">{error}</p> : null}
        {helperText && !error ? <p className="text-sm text-gray-400">{helperText}</p> : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
