import React from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[#F7F7F7]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(26,29,49,0.96)_0%,rgba(17,20,35,0.96)_100%)] px-4 py-2.5 text-[#F7F7F7] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 transition-all duration-300 focus:border-[#8ef7c7]/55 focus:outline-none focus:ring-2 focus:ring-[#cab8ff]/25 focus:shadow-[0_0_0_1px_rgba(142,247,199,0.15),0_12px_28px_rgba(147,216,255,0.12)] disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-[#ff8fbe] focus:border-[#ff8fbe] focus:ring-[#ff8fbe]/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-[#FF6B00]">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
