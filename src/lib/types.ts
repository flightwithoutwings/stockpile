
export type InventoryItem = {
  id: string;
  title: string;
  author?: string;
  publicationDate?: Date;
  description?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  originalFileFormats?: string[];
  originalName?: string;
  isOriginalNameNA?: boolean;
  calibredStatus?: 'yes' | 'no' | 'na';
};
