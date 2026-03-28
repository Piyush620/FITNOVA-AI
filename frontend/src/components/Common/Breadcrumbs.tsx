import React from 'react';
import { cn } from '../../lib/cn';

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('theme-breadcrumb flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em]', className)}
    >
      {items.map((item, index) => {
        const isClickable = typeof item.onClick === 'function' && !item.isCurrent;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {isClickable ? (
              <button
                type="button"
                onClick={item.onClick}
                className="theme-breadcrumb-link rounded-full px-2 py-1 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={cn(
                  'rounded-full px-2 py-1',
                  item.isCurrent ? 'theme-breadcrumb-current' : ''
                )}
              >
                {item.label}
              </span>
            )}
            {index < items.length - 1 ? <span className="theme-breadcrumb-separator">/</span> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
