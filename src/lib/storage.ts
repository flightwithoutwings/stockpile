
import { get, set, del, keys, clear, createStore } from 'idb-keyval';
import type { InventoryItem } from './types';

// Create separate stores for items and images for better organization
const itemStore = createStore('inventory-items', 'items');
const imageStore = createStore('inventory-images', 'images');

// == Item Functions ==

export const getAllItems = async (): Promise<InventoryItem[]> => {
  try {
    const itemKeys = await keys(itemStore);
    const items = await Promise.all(itemKeys.map(key => get(key, itemStore)));
    return items.filter((item): item is InventoryItem => !!item);
  } catch (error) {
    console.error("Failed to get all items from IndexedDB", error);
    return [];
  }
};

export const setItem = async (item: InventoryItem): Promise<void> => {
  try {
    await set(item.id, item, itemStore);
  } catch (error) {
    console.error(`Failed to set item ${item.id} in IndexedDB`, error);
  }
};

export const deleteItem = async (itemId: string): Promise<void> => {
  try {
    await del(itemId, itemStore);
    // Also delete the associated image
    await delImage(itemId);
  } catch (error) {
    console.error(`Failed to delete item ${itemId} from IndexedDB`, error);
  }
};

// == Image Functions ==

export const setImage = async (itemId: string, imageDataUrl: string): Promise<void> => {
    try {
      if (!imageDataUrl) {
        // If the URL is empty, remove any existing image for this item
        await delImage(itemId);
        return;
      }
      // Only store new images if they are data URIs (uploads)
      if (imageDataUrl.startsWith('data:image/')) {
        await set(itemId, imageDataUrl, imageStore);
      }
  } catch (error) {
    console.error(`Failed to set image for item ${itemId} in IndexedDB`, error);
  }
};

export const getImage = async (itemId: string): Promise<string | undefined> => {
    try {
        return await get(itemId, imageStore);
    } catch (error) {
        console.error(`Failed to get image for item ${itemId} from IndexedDB`, error);
        return undefined;
    }
};


export const delImage = async (itemId: string): Promise<void> => {
  try {
    await del(itemId, imageStore);
  } catch (error) {
    console.error(`Failed to delete image for item ${itemId} from IndexedDB`, error);
  }
};

// == Bulk/Utility Functions ==

export const clearAllData = async (): Promise<void> => {
    try {
        await clear(itemStore);
        await clear(imageStore);
    } catch (error) {
        console.error("Failed to clear all data from IndexedDB", error);
    }
};
