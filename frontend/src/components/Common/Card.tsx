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
    glass: 'theme-card theme-card-glass backdrop-blur-xl',
  };

  return (
    <div
      className={cn(
        'group page-ambient relative rounded-[1.75rem] border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-all duration-300 motion-safe:[animation:fadeUp_420ms_ease-out] motion-safe:will-change-transform motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_28px_64px_rgba(0,0,0,0.28)]',
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
