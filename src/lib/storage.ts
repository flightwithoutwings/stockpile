
import { get, set, del, keys, clear, createStore } from 'idb-keyval';
import type { InventoryItem } from './types';

// Store for items
const itemStore = createStore('inventory-items', 'items');


// == Item Functions ==
export const getItem = async (key: IDBValidKey): Promise<InventoryItem | undefined> => {
    return await get(key, itemStore);
}

export const getAllItemKeys = async (): Promise<IDBValidKey[]> => {
    return await keys(itemStore);
}

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
  } catch (error) {
    console.error(`Failed to delete item ${itemId} from IndexedDB`, error);
  }
};

// == Bulk/Utility Functions ==

export const clearAllData = async (): Promise<void> => {
    try {
        await clear(itemStore);
    } catch (error) {
        console.error("Failed to clear all data from IndexedDB", error);
    }
};
