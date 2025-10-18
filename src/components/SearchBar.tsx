
'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Tags, ArrowUp, ArrowDown, History, CaseSensitive, X, ChevronDown } from 'lucide-react';
import type { SortDirection, SortOption, SearchField } from '@/hooks/useInventory';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';


interface SearchBarProps {
  initialSearchTerm: string;
  onSearch: (term: string) => void;
  searchField: SearchField;
  onSearchFieldChange: (field: SearchField) => void;
  sortOption: SortOption;
  onSortOptionChange: (option: SortOption) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  allTags: string[];
  activeTags: Set<string>;
  onTagToggle: (tag: string) => void;
  onManageTagsClick: () => void;
}

const searchFieldLabels: Record<SearchField, string> = {
  title: 'Title',
  author: 'Author',
  fileFormat: 'File Format',
  originalName: 'Original File Name',
  notes: 'Notes',
};

const SearchBar: React.FC<SearchBarProps> = ({
  initialSearchTerm,
  onSearch,
  searchField,
  onSearchFieldChange,
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
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-grow max-w-lg flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="text"
                placeholder={`Search by ${searchFieldLabels[searchField]}...`}
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                Search In: <span className="font-semibold ml-2">{searchFieldLabels[searchField]}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {(Object.keys(searchFieldLabels) as SearchField[]).map((field) => (
                    <DropdownMenuItem
                        key={field}
                        onClick={() => onSearchFieldChange(field)}
                        className={cn(searchField === field && 'bg-accent')}
                    >
                        {searchFieldLabels[field]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">Sort By:</span>
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
            <Separator orientation="vertical" className="h-6 mx-1" />
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
        <div className="mb-8 flex items-center gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Available Tags:</h2>
                <Button variant="outline" size="sm" onClick={onManageTagsClick}>
                <Tags className="mr-2 h-4 w-4" />
                Manage Tags
                </Button>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex flex-wrap gap-2 flex-1">
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
