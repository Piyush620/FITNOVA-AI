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
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8f97ab]', className)}>
      {items.map((item, index) => {
        const isClickable = typeof item.onClick === 'function' && !item.isCurrent;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {isClickable ? (
              <button
                type="button"
                onClick={item.onClick}
                className="rounded-full px-2 py-1 transition-colors hover:bg-white/5 hover:text-[#F7F7F7]"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={cn(
                  'rounded-full px-2 py-1',
                  item.isCurrent ? 'bg-white/5 text-[#F7F7F7]' : ''
                )}
              >
                {item.label}
              </span>
            )}
            {index < items.length - 1 ? <span className="text-[#525867]">/</span> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
