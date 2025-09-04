
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxPagesToShow?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxPagesToShow = 5, 
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    
    let start = Math.max(2, currentPage - Math.floor((maxPagesToShow - 3) / 2));
    let end = Math.min(totalPages - 1, start + maxPagesToShow - 4);
    
    if (end - start < maxPagesToShow - 4) {
        start = Math.max(2, end - (maxPagesToShow - 4));
    }

    for (let i = start; i <= end; i++) {
        pages.add(i);
    }

    const pageArray = Array.from(pages).sort((a,b) => a - b);
    const finalPages: (number | '...')[] = [];
    
    let lastPage: number | null = null;
    for(const page of pageArray) {
        if(lastPage !== null && page - lastPage > 1) {
            finalPages.push('...');
        }
        finalPages.push(page);
        lastPage = page;
    }
    
    return finalPages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="flex items-center justify-center px-2">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(page as number)}
            className={cn(currentPage === page && 'font-bold')}
             aria-label={`Go to page ${page}`}
             aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

export default Pagination;
