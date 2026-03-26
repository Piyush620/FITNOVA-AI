import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'border-[#2e303a] bg-[#131621]',
    gradient: 'border-[#00FF88]/20 bg-gradient-to-br from-[#181a2a] to-[#131d31]',
    glass: 'border-white/10 bg-white/5 backdrop-blur-md',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)]',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};
