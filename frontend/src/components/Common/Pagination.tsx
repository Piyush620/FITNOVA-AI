import React from 'react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const buildPageRange = (page: number, totalPages: number) => {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let current = page - 1; current <= page + 1; current += 1) {
    if (current > 1 && current < totalPages) {
      pages.add(current);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
};

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages);

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>

      {pages.map((currentPage, index) => {
        const previousPage = pages[index - 1];
        const showGap = previousPage && currentPage - previousPage > 1;

        return (
          <React.Fragment key={currentPage}>
            {showGap ? <span className="px-1 text-sm text-slate-500">...</span> : null}
            <Button
              size="sm"
              variant={currentPage === page ? 'primary' : 'secondary'}
              onClick={() => onPageChange(currentPage)}
              className="min-w-10"
            >
              {currentPage}
            </Button>
          </React.Fragment>
        );
      })}

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};
