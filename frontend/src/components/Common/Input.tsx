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
            'flex h-11 w-full rounded-xl border border-[#2e303a] bg-[#11131d] px-4 py-2.5 text-[#F7F7F7] placeholder:text-slate-500 transition-colors duration-200 focus:border-[#00FF88] focus:outline-none focus:ring-2 focus:ring-[#00FF88]/20 disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-[#FF6B00] focus:border-[#FF6B00] focus:ring-[#FF6B00]/20',
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
