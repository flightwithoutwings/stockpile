
'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Tags, ArrowUp, ArrowDown, History, CaseSensitive, X } from 'lucide-react';
import type { SortDirection, SortOption } from '@/hooks/useInventory';

interface SearchBarProps {
  initialSearchTerm: string;
  onSearch: (term: string) => void;
  sortOption: SortOption;
  onSortOptionChange: (option: SortOption) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  allTags: string[];
  activeTags: Set<string>;
  onTagToggle: (tag: string) => void;
  onManageTagsClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialSearchTerm,
  onSearch,
  sortOption,
  onSortOptionChange,
  sortDirection,
  onSortDirectionChange,
  allTags,
  activeTags,
  onTagToggle,
  onManageTagsClick,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    setLocalSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(localSearchTerm);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearch('');
  };

  return (
    <>
      <div className="mb-6 relative w-full max-w-lg">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by title and/or author (press Enter to search)"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-10 pr-10 w-full shadow-sm text-base"
        />
        {localSearchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleClearSearch}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Sort By:</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={sortOption === 'createdAt' ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
            onClick={() => onSortOptionChange('createdAt')}
          >
            <History className="mr-2 h-4 w-4" />
            Added Date
          </Badge>
          <Badge
            variant={sortOption === 'title' ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
            onClick={() => onSortOptionChange('title')}
          >
            <CaseSensitive className="mr-2 h-4 w-4" />
            Alphabetically
          </Badge>
        </div>
        <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Badge
            variant={sortDirection === 'asc' ? 'secondary' : 'outline'}
            className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
            onClick={() => onSortDirectionChange('asc')}
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Ascending
          </Badge>
          <Badge
            variant={sortDirection === 'desc' ? 'secondary' : 'outline'}
            className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
            onClick={() => onSortDirectionChange('desc')}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            Descending
          </Badge>
        </div>
      </div>

      {allTags && allTags.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Available Tags:</h2>
            <Button variant="outline" size="sm" onClick={onManageTagsClick}>
              <Tags className="mr-2 h-4 w-4" />
              Manage Tags
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={activeTags.has(tag) ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;

    