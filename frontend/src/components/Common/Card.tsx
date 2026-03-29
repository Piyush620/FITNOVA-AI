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
        'group page-ambient relative rounded-[1.75rem] border p-6 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition-[box-shadow,border-color,background] duration-300 motion-safe:[animation:fadeUp_320ms_ease-out] motion-safe:hover:shadow-[0_20px_44px_rgba(0,0,0,0.2)]',
        variantClasses[variant],
        className
      )}
    >
      <div className="theme-card-highlight pointer-events-none absolute inset-0 rounded-[inherit]" />
      <div className="theme-card-sheen pointer-events-none absolute inset-x-[-20%] top-0 h-px transition-opacity duration-500" />
      {children}
    </div>
  );
};
