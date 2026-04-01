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
    default: 'theme-card theme-card-default',
    gradient: 'theme-card theme-card-gradient',
    glass: 'theme-card theme-card-glass',
  };

  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] border p-6 shadow-[0_8px_22px_rgba(0,0,0,0.12)] transition-colors duration-150',
        variantClasses[variant],
        className
      )}
    >
      <div className="theme-card-highlight pointer-events-none absolute inset-0 rounded-[inherit]" />
      {children}
    </div>
  );
};
