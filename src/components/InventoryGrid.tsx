import type React from 'react';
import InventoryItemCard from './InventoryItemCard';
import type { InventoryItem } from '@/lib/types';
import { Library, PackageSearch } from 'lucide-react';

interface InventoryGridProps {
  items: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  isLoading: boolean;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onEditItem, onDeleteItem, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 py-8">
        {Array.from({ length: 12 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Library className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Your Library is Empty</h3>
        <p className="text-muted-foreground">
          No items match your search criteria, or your library is currently empty. <br/>
          Try adjusting your search or add new comics/books to your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 py-8">
      {items.map((item) => (
        <InventoryItemCard
          key={item.id}
          item={item}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
        />
      ))}
    </div>
  );
};

const CardSkeleton: React.FC = () => (
  <div className="flex flex-col rounded-lg border bg-card shadow-sm animate-pulse">
    <div className="aspect-[2/3] w-full bg-muted rounded-t-lg" />
    <div className="p-3 space-y-2">
      <div className="h-5 w-3/4 bg-muted rounded" />
      <div className="h-4 w-1/2 bg-muted rounded" />
      <div className="h-3 w-1/3 bg-muted rounded" />
       <div className="flex flex-wrap gap-1 pt-1">
        <div className="h-4 w-12 bg-muted rounded-full" />
        <div className="h-4 w-16 bg-muted rounded-full" />
      </div>
    </div>
  </div>
);


export default InventoryGrid;
