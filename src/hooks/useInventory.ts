
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { InventoryItem } from '@/lib/types';
import type { InventoryItemFormValues } from '@/lib/schemas';

const LOCAL_STORAGE_KEY = 'comicBookLibrary';

const initialMockData: InventoryItem[] = [
  {
    id: '1',
    title: 'The Legend of Korra: Patterns in Time',
    author: 'Michael Dante DiMartino, Bryan Konietzko',
    year: 2023,
    description: 'An anthology of standalone stories from The Legend of Korra.',
    imageUrl: 'https://placehold.co/200x300.png',
    tags: ['comic', 'anthology', 'fantasy'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    originalFileFormats: ['CBZ'],
    originalName: 'LoK_Patterns_in_Time.cbz',
    isOriginalNameNA: false,
    calibredStatus: 'yes',
  },
  {
    id: '2',
    title: 'Avatar: The Last Airbender – The Rift',
    author: 'Gene Luen Yang, Michael Dante DiMartino, Bryan Konietzko',
    year: 2014,
    description: 'Aang struggles with tradition and progress as he helps build Republic City.',
    imageUrl: 'https://m.media-amazon.com/images/I/81cVD2sCKtL._SL1500_.jpg',
    tags: ['comic', 'fantasy', 'adventure'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    originalFileFormats: ['PDF', 'Folder'],
    originalName: 'ATLA_The_Rift_Collection',
    isOriginalNameNA: false,
    calibredStatus: 'no',
  },
  {
    id: '3',
    title: 'Avatar: The Last Airbender – The Search',
    author: 'Gene Luen Yang, Michael Dante DiMartino, Bryan Konietzko',
    year: 2013,
    description: 'Zuko searches for his mother, Ursa, with the help of Team Avatar.',
    imageUrl: 'https://placehold.co/200x300.png',
    tags: ['comic', 'fantasy', 'mystery'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    originalFileFormats: [],
    originalName: 'N/A',
    isOriginalNameNA: true,
    calibredStatus: 'yes',
  },
  {
    id: '4',
    title: 'Avatar: The Last Airbender – The Promise',
    author: 'Gene Luen Yang, Michael Dante DiMartino, Bryan Konietzko',
    year: 2012,
    description: 'The Harmony Restoration Movement causes conflict between Aang and Zuko.',
    imageUrl: 'https://placehold.co/200x300.png',
    tags: ['comic', 'fantasy', 'politics'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    originalFileFormats: ['EPUB'],
    originalName: 'The Promise.epub',
    isOriginalNameNA: false,
    calibredStatus: 'no',
  },
];

const sanitizeRawItem = (rawItem: any): InventoryItem => {
  let originalName = '';
  if (rawItem.isOriginalNameNA) {
    originalName = 'N/A';
  } else if (typeof rawItem.originalName === 'string') {
    originalName = rawItem.originalName;
  }

  return {
    id: rawItem.id || crypto.randomUUID(),
    title: rawItem.title || 'Untitled',
    author: rawItem.author || '',
    year: rawItem.year === null ? undefined : (typeof rawItem.year === 'number' ? rawItem.year : undefined),
    description: rawItem.description || '',
    imageUrl: typeof rawItem.imageUrl === 'string' ? rawItem.imageUrl : '',
    tags: Array.isArray(rawItem.tags) ? rawItem.tags.map(t => String(t).toLowerCase()) : [],
    createdAt: rawItem.createdAt ? new Date(rawItem.createdAt) : new Date(),
    updatedAt: rawItem.updatedAt ? new Date(rawItem.updatedAt) : new Date(),
    originalFileFormats: Array.isArray(rawItem.originalFileFormats) ? rawItem.originalFileFormats.map(f => String(f)) : [],
    originalName: originalName,
    isOriginalNameNA: typeof rawItem.isOriginalNameNA === 'boolean' ? rawItem.isOriginalNameNA : false,
    calibredStatus: ['yes', 'no', 'na'].includes(rawItem.calibredStatus) ? rawItem.calibredStatus : 'no',
  };
};


export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [allTagsSet, setAllTagsSet] = useState<Set<string>>(new Set());


  useEffect(() => {
    try {
      const storedItemsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      let currentItems: InventoryItem[];
      const newAllTags = new Set<string>();

      if (storedItemsJson) {
        const parsedItems = JSON.parse(storedItemsJson) as any[];
        currentItems = parsedItems.map(sanitizeRawItem);
      } else {
        currentItems = initialMockData.map(sanitizeRawItem);
      }
      setItems(currentItems);
      
      currentItems.forEach(item => {
        if(Array.isArray(item.tags)) {
          item.tags.forEach(tag => newAllTags.add(tag));
        }
      });
      setAllTagsSet(newAllTags);

    } catch (error) {
      console.error("Failed to load items from localStorage:", error);
      const currentItems = initialMockData.map(sanitizeRawItem);
      setItems(currentItems);
      const newAllTags = new Set<string>();
       currentItems.forEach(item => {
        if(Array.isArray(item.tags)) {
          item.tags.forEach(tag => newAllTags.add(tag));
        }
      });
      setAllTagsSet(newAllTags);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save items to localStorage:", error);
      }
    }
  }, [items, isInitialized]);

  const updateAllTagsInSet = useCallback((newTags: string[]) => {
    setAllTagsSet(prevAllTags => {
      const updatedTags = new Set(prevAllTags);
      newTags.forEach(tag => updatedTags.add(tag.toLowerCase()));
      return updatedTags;
    });
  }, []);
  

  const addItem = useCallback((formData: InventoryItemFormValues) => {
    const newItemId = crypto.randomUUID();
    const newItem: InventoryItem = {
      id: newItemId,
      title: formData.title,
      author: formData.author || '',
      year: formData.year,
      description: formData.description || '',
      imageUrl: typeof formData.imageUrl === 'string' ? formData.imageUrl : '',
      tags: (formData.tags || []).map(t => t.toLowerCase()),
      createdAt: new Date(),
      updatedAt: new Date(),
      originalFileFormats: formData.originalFileFormats || [],
      originalName: formData.isOriginalNameNA ? 'N/A' : formData.originalName || '',
      isOriginalNameNA: formData.isOriginalNameNA || false,
      calibredStatus: formData.calibredStatus || 'no',
    };
    setItems((prevItems) => [newItem, ...prevItems]);
    if (newItem.tags) updateAllTagsInSet(newItem.tags);
  }, [updateAllTagsInSet]);

  const updateItem = useCallback((itemId: string, formData: InventoryItemFormValues) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedItemData: InventoryItem = {
            ...item,
            title: formData.title,
            author: formData.author || '',
            year: formData.year,
            description: formData.description || '',
            imageUrl: typeof formData.imageUrl === 'string' ? formData.imageUrl : (item.imageUrl || ''),
            tags: (formData.tags || []).map(t => t.toLowerCase()),
            updatedAt: new Date(),
            originalFileFormats: formData.originalFileFormats || [],
            originalName: formData.isOriginalNameNA ? 'N/A' : formData.originalName || '',
            isOriginalNameNA: formData.isOriginalNameNA || false,
            calibredStatus: formData.calibredStatus || 'no',
          };
          return updatedItemData;
        }
        return item;
      })
    );

    if (formData.tags) updateAllTagsInSet(formData.tags);

  }, [updateAllTagsInSet]);

  const deleteItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    if (trimmedSearchTerm) {
      const searchKeywords = trimmedSearchTerm.split(' ').filter(term => term.trim() !== '');
      if (searchKeywords.length > 0) {
        filtered = items.filter((item) => {
          return searchKeywords.every(keyword =>
            (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(keyword))) ||
            item.title.toLowerCase().includes(keyword) ||
            (item.author && item.author.toLowerCase().includes(keyword)) ||
            (item.description && item.description.toLowerCase().includes(keyword)) ||
            (item.year && item.year.toString().includes(keyword))
          );
        });
      }
    }
    return filtered.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });
  }, [items, searchTerm]);

  const backupData = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const dataStr = JSON.stringify(items, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `comic_book_library_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    } catch (error) {
      console.error("Failed to backup data:", error);
    }
  }, [items]);

  const restoreData = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/json') {
      throw new Error("Invalid file type. Please select a JSON file.");
    }

    backupData();

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) {
            throw new Error("File content is empty.");
          }
          const parsedData = JSON.parse(content);

          if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item.id === 'string' && typeof item.title === 'string')) {
            throw new Error("Invalid data format. Expected an array of inventory items.");
          }

          const restoredItems: InventoryItem[] = parsedData.map(sanitizeRawItem);
          setItems(restoredItems);

          const newAllTags = new Set<string>();
          restoredItems.forEach(item => {
            if (Array.isArray(item.tags)) {
              item.tags.forEach(tag => newAllTags.add(tag));
            }
          });
          setAllTagsSet(newAllTags);
          
          resolve();
        } catch (error) {
          console.error("Failed to parse or process restore file:", error);
          reject(error instanceof Error ? error : new Error(String(error) || "Unknown error during restore processing."));
        }
      };
      reader.onerror = (error) => {
        console.error("Failed to read file:", error);
        reject(new Error("Failed to read file."));
      };
      reader.readAsText(file);
    });
  }, [backupData]);

  const allTagsArray = useMemo(() => Array.from(allTagsSet).sort(), [allTagsSet]);

  return {
    items: filteredAndSortedItems,
    addItem,
    updateItem,
    deleteItem,
    searchTerm,
    setSearchTerm,
    backupData,
    restoreData,
    isLoading: !isInitialized,
    allTags: allTagsArray,
    addNewGlobalTag: (tag: string) => {
        if (tag.trim() !== '') {
            setAllTagsSet(prev => {
              const newSet = new Set(prev);
              newSet.add(tag.toLowerCase());
              return newSet;
            });
        }
    },
  };
}
