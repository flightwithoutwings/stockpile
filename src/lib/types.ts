
export type InventoryItem = {
  id: string;
  title: string;
  author?: string;
  publicationDate?: Date;
  description?: string;
  notes?: string;
  bundleName?: string;
  imageUrl?: string;
  imageURI?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  originalFileFormats?: string[];
  originalName?: string;
  isOriginalNameNA?: boolean;
  calibredStatus?: 'yes' | 'no' | 'na';
};

export type ScrapedItemData = {
  title: string;
  author: string;
  year: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  printLength: string;
  fileSize: string;
};
