import React from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[1.1rem] border text-sm font-semibold tracking-[0.01em] transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ef7c7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]';

    const variantClasses = {
      primary:
        'border-white/15 bg-[linear-gradient(135deg,#fff6fb_0%,#ffe0ef_32%,#cbbcff_100%)] text-[#151628] shadow-[0_14px_34px_rgba(255,181,211,0.22)] hover:shadow-[0_20px_44px_rgba(255,181,211,0.28)]',
      secondary:
        'border-white/10 bg-[linear-gradient(135deg,rgba(24,26,42,0.98)_0%,rgba(18,22,38,0.92)_100%)] text-white shadow-[0_14px_30px_rgba(0,0,0,0.24)] hover:border-[#cab8ff]/40 hover:bg-[linear-gradient(135deg,rgba(34,37,61,0.98)_0%,rgba(20,23,40,0.96)_100%)] hover:text-[#fdf7ff]',
      accent:
        'border-[#8ef7c7]/60 bg-[linear-gradient(135deg,#8ef7c7_0%,#93d8ff_52%,#cab8ff_100%)] text-[#101425] shadow-[0_16px_40px_rgba(142,247,199,0.24)] hover:shadow-[0_20px_50px_rgba(142,247,199,0.32)]',
    };

    const sizeClasses = {
      sm: 'h-9 px-3',
      md: 'h-11 px-5 text-base',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          (isLoading || disabled) && 'cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      >
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="absolute inset-y-0 left-[-20%] w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] motion-safe:group-hover:[animation:sheenSlide_900ms_ease]" />
        </span>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
