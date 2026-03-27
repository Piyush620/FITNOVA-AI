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
            'w-full rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(26,29,49,0.96)_0%,rgba(17,20,35,0.96)_100%)] px-4 py-3 text-[#F7F7F7] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 transition-all duration-300 focus:border-[#8ef7c7]/55 focus:outline-none focus:ring-2 focus:ring-[#cab8ff]/25 focus:shadow-[0_0_0_1px_rgba(142,247,199,0.15),0_12px_28px_rgba(147,216,255,0.12)] disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-[#ff8fbe] focus:border-[#ff8fbe] focus:ring-[#ff8fbe]/20',
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
