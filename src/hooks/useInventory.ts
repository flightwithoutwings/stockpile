
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { InventoryItem } from '@/lib/types';
import type { InventoryItemFormValues } from '@/lib/schemas';
import { getAllItems, setItem, deleteItem, setImage, getImage, clearAllData } from '@/lib/storage';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedItems = await getAllItems();
        const currentItems = storedItems.map(sanitizeRawItem);
        
        // Fetch images for the items
        for (const item of currentItems) {
            if (item.imageUrl && item.imageUrl.startsWith('idb:')) {
                const imageId = item.imageUrl.split(':')[1];
                const imageDataUrl = await getImage(imageId);
                if (imageDataUrl) {
                    item.imageUrl = imageDataUrl;
                }
            }
        }
        
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
        // We no longer save all items to localStorage. setItem handles individual saves.
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
    const newItemId = crypto.randomUUID();
    let imageUrlToStore = typeof formData.imageUrl === 'string' ? formData.imageUrl : '';

    if (imageUrlToStore.startsWith('data:image/')) {
        await setImage(newItemId, imageUrlToStore);
        // We keep the data URI in the state for immediate display, but it won't be persisted this way.
    }

    const newItem: InventoryItem = {
      id: newItemId,
      title: formData.title,
      author: formData.author || '',
      publicationDate: formData.publicationDate,
      description: formData.description || '',
      notes: formData.notes || '',
      imageUrl: imageUrlToStore,
      tags: (formData.tags || []).map(t => t.toLowerCase()),
      createdAt: new Date(),
      updatedAt: new Date(),
      originalFileFormats: formData.originalFileFormats || [],
      originalName: formData.isOriginalNameNA ? 'N/A' : (formData.originalName || ''),
      isOriginalNameNA: formData.isOriginalNameNA || false,
      calibredStatus: formData.calibredStatus || 'no',
    };
    
    // Create a version for IndexedDB with an image reference if needed.
    const itemToPersist = { ...newItem };
    if (imageUrlToStore.startsWith('data:image/')) {
        itemToPersist.imageUrl = `idb:${newItemId}`;
    }

    await setItem(itemToPersist);
    setItems((prevItems) => [newItem, ...prevItems]);
    if (newItem.tags) updateAllTagsInSet(newItem.tags);
  }, [updateAllTagsInSet]);

  const updateItem = useCallback(async (itemId: string, formData: InventoryItemFormValues) => {
    let imageUrlToUpdate = typeof formData.imageUrl === 'string' ? formData.imageUrl : '';

    if (imageUrlToUpdate.startsWith('data:image/')) {
        await setImage(itemId, imageUrlToUpdate);
    } else if (!imageUrlToUpdate) {
        // If the URL is cleared, remove from storage
        await setImage(itemId, '');
    }

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
            imageUrl: imageUrlToUpdate,
            tags: (formData.tags || []).map(t => t.toLowerCase()),
            updatedAt: new Date(),
            originalFileFormats: formData.originalFileFormats || [],
            originalName: formData.isOriginalNameNA ? 'N/A' : (formData.originalName || ''),
            isOriginalNameNA: formData.isOriginalNameNA || false,
            calibredStatus: formData.calibredStatus || 'no',
          };
          
          const itemToPersist = { ...updatedItemData };
          if (imageUrlToUpdate.startsWith('data:image/')) {
            itemToPersist.imageUrl = `idb:${itemId}`;
          }
          setItem(itemToPersist);

          return updatedItemData;
        }
        return item;
      })
    );

    if (formData.tags) updateAllTagsInSet(formData.tags);

  }, [updateAllTagsInSet]);

  const deleteItemAndImage = useCallback(async (itemId: string) => {
    await deleteItem(itemId); // This also handles deleting the image via the storage lib
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

  const backupData = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const itemsToBackup = await getAllItems(); // Fetches from IndexedDB
      const itemsWithImages = await Promise.all(itemsToBackup.map(async (item) => {
        if (item.imageUrl && item.imageUrl.startsWith('idb:')) {
          const imageId = item.imageUrl.split(':')[1];
          const imageData = await getImage(imageId);
          return { ...item, imageUrl: imageData || '' };
        }
        return item;
      }));

      const dataStr = JSON.stringify(itemsWithImages, null, 2);
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
  }, []);

  const restoreData = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/json') {
      throw new Error("Invalid file type. Please select a JSON file.");
    }

    await backupData(); // First, backup current data as a precaution.

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
          
          await clearAllData(); // Clear existing IndexedDB data

          const restoredItems = parsedData.map(sanitizeRawItem);
          const newAllTags = new Set<string>();

          for (const item of restoredItems) {
            const { imageUrl, ...itemData } = item;
            let itemToPersist = { ...itemData, imageUrl: '' };
            
            if (imageUrl && imageUrl.startsWith('data:image/')) {
              await setImage(item.id, imageUrl);
              itemToPersist.imageUrl = `idb:${item.id}`;
            } else {
              itemToPersist.imageUrl = imageUrl || '';
            }

            await setItem(itemToPersist);
            
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
        const updatedItems = prevItems.map(item => ({
            ...item,
            tags: item.tags.map(t => t === oldTag ? trimmedNewTag : t)
        }));

        // Persist the changes for each modified item
        updatedItems.forEach(item => {
            if (item.tags.includes(trimmedNewTag)) {
                let itemToPersist = { ...item };
                if (item.imageUrl && item.imageUrl.startsWith('data:image/')) {
                    itemToPersist.imageUrl = `idb:${item.id}`;
                }
                setItem(itemToPersist);
            }
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
        const updatedItems = prevItems.map(item => ({
            ...item,
            tags: item.tags.filter(t => t !== tagToDelete)
        }));

        // Persist the changes for each modified item
        updatedItems.forEach(item => {
             if (!item.tags.includes(tagToDelete)) {
                let itemToPersist = { ...item };
                if (item.imageUrl && item.imageUrl.startsWith('data:image/')) {
                    itemToPersist.imageUrl = `idb:${item.id}`;
                }
                setItem(itemToPersist);
            }
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

    