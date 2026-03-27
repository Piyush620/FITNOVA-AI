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
    default:
      'border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_34%),linear-gradient(180deg,#17192b_0%,#101320_100%)]',
    gradient:
      'border-[#8ef7c7]/20 bg-[radial-gradient(circle_at_top_left,rgba(142,247,199,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,181,211,0.12),transparent_24%),linear-gradient(145deg,#1c2038_0%,#141a2d_52%,#1a1832_100%)]',
    glass:
      'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl',
  };

  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-all duration-300 motion-safe:[animation:fadeUp_420ms_ease-out] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_28px_64px_rgba(0,0,0,0.28)]',
        variantClasses[variant],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_24%)]" />
      {children}
    </div>
  );
};
