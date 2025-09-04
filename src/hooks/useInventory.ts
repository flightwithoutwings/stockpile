
'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { InventoryItem } from '@/lib/types';
import type { InventoryItemFormValues } from '@/lib/schemas';
import { getAllItems, setItem, deleteItem, clearAllData, getAllItemKeys, getItem } from '@/lib/storage';
import type { ExportType } from '@/components/AppHeader';

const SORT_CONFIG_KEY = 'comicBookLibrarySortConfig';

type SortOption = 'createdAt' | 'title';
type SortDirection = 'asc' | 'desc';

const sanitizeRawItem = (rawItem: any): InventoryItem => {
  const isOriginalNameTrulyNA = typeof rawItem.isOriginalNameNA === 'boolean' ? rawItem.isOriginalNameNA : false;
  
  let originalNameValue = '';
  if (isOriginalNameTrulyNA) {
    originalNameValue = 'N/A';
  } else {
    originalNameValue = typeof rawItem.originalName === 'string' ? rawItem.originalName : '';
  }

  const dateValue = rawItem.publicationDate ? new Date(rawItem.publicationDate) : undefined;
  const publicationDateValue = (dateValue && !isNaN(dateValue.getTime())) ? dateValue : undefined;

  return {
    id: (typeof rawItem.id === 'string' && rawItem.id) ? rawItem.id : crypto.randomUUID(),
    title: (typeof rawItem.title === 'string' && rawItem.title.trim()) ? rawItem.title : 'Untitled',
    author: typeof rawItem.author === 'string' ? rawItem.author : '',
    publicationDate: publicationDateValue,
    description: typeof rawItem.description === 'string' ? rawItem.description : '',
    notes: typeof rawItem.notes === 'string' ? rawItem.notes : '',
    imageUrl: typeof rawItem.imageUrl === 'string' ? rawItem.imageUrl : '',
    imageURI: typeof rawItem.imageURI === 'string' ? rawItem.imageURI : '',
    tags: Array.isArray(rawItem.tags) ? rawItem.tags.map(t => String(t).toLowerCase()) : [],
    createdAt: rawItem.createdAt ? new Date(rawItem.createdAt) : new Date(),
    updatedAt: rawItem.updatedAt ? new Date(rawItem.updatedAt) : new Date(),
    originalFileFormats: Array.isArray(rawItem.originalFileFormats) ? rawItem.originalFileFormats.map(f => String(f)) : [],
    originalName: originalNameValue,
    isOriginalNameNA: isOriginalNameTrulyNA,
    calibredStatus: ['yes', 'no', 'na'].includes(rawItem.calibredStatus) ? rawItem.calibredStatus : 'no',
  };
};

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [allTagsSet, setAllTagsSet] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const exportCounter = useRef(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedItems = await getAllItems();
        const currentItems = storedItems.map(sanitizeRawItem);
        
        setItems(currentItems);

        const newAllTags = new Set<string>();
        currentItems.forEach(item => {
          if(Array.isArray(item.tags)) {
            item.tags.forEach(tag => newAllTags.add(tag));
          }
        });
        setAllTagsSet(newAllTags);

        const storedSortConfig = localStorage.getItem(SORT_CONFIG_KEY);
        if (storedSortConfig) {
          const { option, direction } = JSON.parse(storedSortConfig);
          if (['createdAt', 'title'].includes(option)) setSortOption(option);
          if (['asc', 'desc'].includes(direction)) setSortDirection(direction);
        }

      } catch (error) {
        console.error("Failed to load items from IndexedDB:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(SORT_CONFIG_KEY, JSON.stringify({ option: sortOption, direction: sortDirection }));
      } catch (error) {
        console.error("Failed to save sort config to localStorage:", error);
      }
    }
  }, [sortOption, sortDirection, isInitialized]);

  const updateAllTagsInSet = useCallback((newTags: string[]) => {
    setAllTagsSet(prevAllTags => {
      const updatedTags = new Set(prevAllTags);
      newTags.forEach(tag => updatedTags.add(tag.toLowerCase()));
      return updatedTags;
    });
  }, []);

  const addItem = useCallback(async (formData: InventoryItemFormValues) => {
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      title: formData.title,
      author: formData.author || '',
      publicationDate: formData.publicationDate,
      description: formData.description || '',
      notes: formData.notes || '',
      imageUrl: formData.imageUrl || '',
      imageURI: formData.imageURI || '',
      tags: (formData.tags || []).map(t => t.toLowerCase()),
      createdAt: new Date(),
      updatedAt: new Date(),
      originalFileFormats: formData.originalFileFormats || [],
      originalName: formData.isOriginalNameNA ? 'N/A' : (formData.originalName || ''),
      isOriginalNameNA: formData.isOriginalNameNA || false,
      calibredStatus: formData.calibredStatus || 'no',
    };
    
    await setItem(newItem);
    setItems((prevItems) => [newItem, ...prevItems]);
    if (newItem.tags) updateAllTagsInSet(newItem.tags);
  }, [updateAllTagsInSet]);

  const updateItem = useCallback(async (itemId: string, formData: InventoryItemFormValues) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedItemData: InventoryItem = {
            ...item,
            title: formData.title,
            author: formData.author || '',
            publicationDate: formData.publicationDate,
            description: formData.description || '',
            notes: formData.notes || '',
            imageUrl: formData.imageUrl || '',
            imageURI: formData.imageURI || '',
            tags: (formData.tags || []).map(t => t.toLowerCase()),
            updatedAt: new Date(),
            originalFileFormats: formData.originalFileFormats || [],
            originalName: formData.isOriginalNameNA ? 'N/A' : (formData.originalName || ''),
            isOriginalNameNA: formData.isOriginalNameNA || false,
            calibredStatus: formData.calibredStatus || 'no',
          };
          
          setItem(updatedItemData);
          return updatedItemData;
        }
        return item;
      })
    );

    if (formData.tags) updateAllTagsInSet(formData.tags);

  }, [updateAllTagsInSet]);

  const deleteItemAndImage = useCallback(async (itemId: string) => {
    await deleteItem(itemId);
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const toggleTagInFilter = useCallback((tagToToggle: string) => {
    setActiveTags(prevActiveTags => {
      const newActiveTags = new Set(prevActiveTags);
      if (newActiveTags.has(tagToToggle)) {
        newActiveTags.delete(tagToToggle);
      } else {
        newActiveTags.add(tagToToggle);
      }
      return newActiveTags;
    });
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    if (activeTags.size > 0) {
      filtered = filtered.filter(item => {
        const itemTags = new Set(item.tags.map(t => t.toLowerCase()));
        return Array.from(activeTags).every(activeTag => itemTags.has(activeTag));
      });
    }

    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    if (trimmedSearchTerm) {
      const searchKeywords = trimmedSearchTerm.split(' ').filter(term => term.trim() !== '');
      if (searchKeywords.length > 0) {
        filtered = filtered.filter((item) => {
          return searchKeywords.every(keyword =>
            item.title.toLowerCase().includes(keyword) ||
            (item.author && item.author.toLowerCase().includes(keyword))
          );
        });
      }
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortOption === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, searchTerm, activeTags, sortOption, sortDirection]);

  const backupData = useCallback(async (type: ExportType) => {
    if (typeof window === "undefined") return;
    try {
        const allItemKeys = await getAllItemKeys();
        
        let fileNameSuffix = '';
        if (type === 'url_only') fileNameSuffix = '_url_only';
        else if (type === 'uri_only') fileNameSuffix = '_uri_only';
        else fileNameSuffix = '_both';
        
        const exportFileDefaultName = `comic_book_library_backup_${new Date().toISOString().split('T')[0]}${fileNameSuffix}_(${exportCounter.current}).json`;
        exportCounter.current += 1;

        // Create a WritableStream to a file.
        // This API is not supported in Firefox and requires a polyfill for wider compatibility.
        // @ts-ignore
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: exportFileDefaultName,
            types: [{
                description: 'JSON files',
                accept: { 'application/json': ['.json'] },
            }],
        });

        // @ts-ignore
        const writable = await fileHandle.createWritable();
        
        await writable.write('[\n');

        for (let i = 0; i < allItemKeys.length; i++) {
            const key = allItemKeys[i];
            const item = await getItem(key);
            if (item) {
                const exportItem = { ...item };
                if (type === 'url_only') {
                    delete exportItem.imageURI;
                } else if (type === 'uri_only') {
                    delete exportItem.imageUrl;
                }

                await writable.write(JSON.stringify(exportItem, null, 2));
                if (i < allItemKeys.length - 1) {
                    await writable.write(',\n');
                }
            }
        }
        
        await writable.write('\n]');
        await writable.close();

    } catch (error) {
        if ((error as DOMException).name === 'AbortError') {
           // User cancelled the save dialog, do nothing.
        } else {
           console.error("Failed to backup data:", error);
           // Consider showing a toast message to the user here.
        }
    }
  }, []);

  const restoreData = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/json') {
      throw new Error("Invalid file type. Please select a JSON file.");
    }

    await backupData('both'); // First, backup current data as a precaution.

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) {
            throw new Error("File content is empty.");
          }
          const parsedData = JSON.parse(content);

          if (!Array.isArray(parsedData)) {
            throw new Error("Invalid data format. Expected an array of inventory items.");
          }
          
          await clearAllData();

          const restoredItems = parsedData.map(sanitizeRawItem);
          const newAllTags = new Set<string>();

          for (const item of restoredItems) {
            await setItem(item);
            if (Array.isArray(item.tags)) {
              item.tags.forEach(tag => newAllTags.add(tag));
            }
          }
          
          setItems(restoredItems);
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

  const addNewGlobalTag = useCallback((tag: string) => {
    if (tag.trim() !== '') {
        setAllTagsSet(prev => {
          const newSet = new Set(prev);
          newSet.add(tag.toLowerCase());
          return newSet;
        });
    }
  }, []);

  const updateGlobalTag = useCallback((oldTag: string, newTag: string) => {
    const trimmedNewTag = newTag.trim().toLowerCase();
    if (!trimmedNewTag || oldTag === trimmedNewTag) return;

    setItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          const hasTag = item.tags.includes(oldTag);
          if (hasTag) {
            const newTags = item.tags.map(t => t === oldTag ? trimmedNewTag : t);
            const updatedItem = { ...item, tags: newTags };
            setItem(updatedItem); // Persist change
            return updatedItem;
          }
          return item;
        });
        return updatedItems;
    });

    setAllTagsSet(prev => {
      const newSet = new Set(Array.from(prev).map(t => t === oldTag ? trimmedNewTag : t));
      return newSet;
    });
  }, []);

  const deleteGlobalTag = useCallback((tagToDelete: string) => {
    setItems(prevItems => {
        const updatedItems = prevItems.map(item => {
            if (item.tags.includes(tagToDelete)) {
              const newTags = item.tags.filter(t => t !== tagToDelete);
              const updatedItem = { ...item, tags: newTags };
              setItem(updatedItem); // Persist change
              return updatedItem;
            }
            return item;
        });
        return updatedItems;
    });

    setAllTagsSet(prev => {
      const newSet = new Set(prev);
      newSet.delete(tagToDelete);
      return newSet;
    });
  }, []);

  return {
    items: filteredAndSortedItems,
    addItem,
    updateItem,
    deleteItem: deleteItemAndImage,
    searchTerm,
    setSearchTerm,
    activeTags,
    toggleTagInFilter,
    backupData,
    restoreData,
    isLoading: !isInitialized,
    allTags: allTagsArray,
    addNewGlobalTag,
    updateGlobalTag,
    deleteGlobalTag,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
  };
}
