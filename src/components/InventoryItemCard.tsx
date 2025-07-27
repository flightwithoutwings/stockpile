
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, ImageIcon } from 'lucide-react'; // Added ImageIcon
import type { InventoryItem } from '@/lib/types';
import { format } from 'date-fns';

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const prevImageUrlRef = useRef<string | undefined | null>();

  useEffect(() => {
    // Only reset imageError if item.imageUrl has actually changed its value.
    if (item.imageUrl !== prevImageUrlRef.current) {
      setImageError(false);
    }
    // Update the ref to the current imageUrl for the next render.
    prevImageUrlRef.current = item.imageUrl;
  }, [item.imageUrl]);

  const handleImageError = useCallback(() => {
    // Set error to true only if it's not already true,
    // to prevent potential issues if onError is called multiple times.
    if (!imageError) {
      setImageError(true);
    }
  }, [imageError]); // Depend on imageError to avoid setting state if already true

  const getAiHint = () => {
    if (item.title.toLowerCase().includes('comic')) return 'comic book';
    if (item.title.toLowerCase().includes('book')) return 'book cover';
    if (item.title.toLowerCase().includes('manga')) return 'manga cover';
    return 'cover art';
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <CardHeader className="p-0 relative">
        <div className="aspect-[2/3] w-full relative">
          {imageError || !item.imageUrl ? (
            <div className="aspect-[2/3] w-full bg-card rounded-t-lg flex items-center justify-center" data-ai-hint="blank image area">
              <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
          ) : (
            <Image
              src={item.imageUrl} // No need for || '' here, handled by the condition above
              alt={item.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={getAiHint()}
              onError={handleImageError}
              unoptimized={item.imageUrl?.startsWith('data:')} // Add this if you expect data URIs and want to bypass Next.js optimization for them
            />
          )}
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/70 hover:bg-background">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col">
        <CardTitle className="text-md font-semibold mb-1 break-words" title={item.title}>{item.title}</CardTitle>
        <div className="mt-auto pt-1">
          {item.author && (
            <p className="text-xs text-muted-foreground truncate" title={item.author}>
              {item.author}
            </p>
          )}
           {item.publicationDate && (
            <p className="text-xs text-muted-foreground">
              {format(item.publicationDate, "PPP")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryItemCard;
