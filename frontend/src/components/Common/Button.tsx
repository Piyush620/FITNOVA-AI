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
      'theme-button group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[1.1rem] border text-sm font-semibold tracking-[0.01em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ef7c7] focus-visible:ring-offset-2';

    const variantClasses = {
      primary: 'theme-button-primary',
      secondary: 'theme-button-secondary',
      accent: 'theme-button-accent',
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
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
