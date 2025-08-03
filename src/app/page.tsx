
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import InventoryGrid from '@/components/InventoryGrid';
import InventoryForm from '@/components/InventoryForm';
import TagManager from '@/components/TagManager';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/hooks/useInventory';
import type { InventoryItem } from '@/lib/types';
import type { InventoryItemFormValues } from '@/lib/schemas';
import { Search, Tags, ArrowUp, ArrowDown, History, CaseSensitive, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const {
    items: inventoryItems,
    addItem,
    updateItem,
    deleteItem,
    searchTerm,
    setSearchTerm,
    activeTags,
    toggleTagInFilter,
    backupData,
    restoreData,
    isLoading,
    allTags,
    addNewGlobalTag,
    updateGlobalTag,
    deleteGlobalTag,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
  } = useInventory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportFileInputRef = useRef<HTMLInputElement>(null);
  const [formCurrentPage, setFormCurrentPage] = useState(1);

  const handleAddItemClick = () => {
    setEditingItem(null);
    setFormCurrentPage(1);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormCurrentPage(1);
    setIsFormOpen(true);
  };

  const handleDeleteItemClick = (itemId: string) => {
    setItemToDelete(itemId);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      const item = inventoryItems.find(i => i.id === itemToDelete);
      deleteItem(itemToDelete);
      toast({
        title: "Item Deleted",
        description: `"${item?.title || 'Item'}" has been successfully deleted.`,
        variant: "destructive",
      });
      setItemToDelete(null);
    }
  };

  const handleFormSubmit = (data: InventoryItemFormValues, itemId?: string) => {
    if (itemId) {
      updateItem(itemId, data);
    } else {
      addItem(data);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };
  
  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setFormCurrentPage(1); 
      setEditingItem(null); 
    }
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTagPillClick = (tagToToggle: string) => {
    toggleTagInFilter(tagToToggle);
  };

  useEffect(() => {
    if (editingItem && isFormOpen) {
      const currentVersionInList = inventoryItems.find(i => i.id === editingItem.id);
      if (currentVersionInList) {
         const currentFormatsString = JSON.stringify(currentVersionInList.originalFileFormats?.slice().sort() || []);
         const editingFormatsString = JSON.stringify(editingItem.originalFileFormats?.slice().sort() || []);
        
        if (currentFormatsString !== editingFormatsString) {
          setEditingItem(currentVersionInList);
        }
      } else {
        setEditingItem(null);
        setIsFormOpen(false); 
      }
    }
  }, [inventoryItems, editingItem, isFormOpen]);


  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelectedForRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json') {
        setFileToRestore(file);
        setShowRestoreConfirm(true);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid JSON file (.json).",
          variant: "destructive",
        });
      }
    }
  };

  const confirmRestoreData = async () => {
    if (!fileToRestore) return;

    toast({
      title: "Restore Process Initiated",
      description: "An automatic backup of current data will be created before restoring.",
    });

    try {
      await restoreData(fileToRestore);
      toast({
        title: "Data Restored Successfully",
        description: "Your library has been restored. The previous data was automatically backed up.",
      });
    } catch (error: any) {
      toast({
        title: "Restore Failed",
        description: error.message || "Could not restore data from the file.",
        variant: "destructive",
      });
    } finally {
      setShowRestoreConfirm(false);
      setFileToRestore(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportJsonItemClick = () => {
    if (jsonImportFileInputRef.current) {
      jsonImportFileInputRef.current.value = '';
      jsonImportFileInputRef.current.click();
    }
  };

  const handleFileSelectedForJsonImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid JSON file (.json) to import item(s).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let successfullyImportedCount = 0;
      let failedImportCount = 0;

      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const jsonData = JSON.parse(text);

        const processJsonObject = (itemJson: any): boolean => {
          if (typeof itemJson !== 'object' || itemJson === null) {
            console.error("Invalid item format in JSON array:", itemJson);
            return false;
          }

          const getPublicationDate = (value: any): Date | undefined => {
            if (!value) return undefined;
            if (value instanceof Date && !isNaN(value.getTime())) return value;
            if (typeof value === 'string' || typeof value === 'number') {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return undefined;
          };
          
          const mappedItem: InventoryItemFormValues = {
            title: String(itemJson.title || itemJson.name || ''),
            author: String(itemJson.author || itemJson.authors || ''),
            publicationDate: getPublicationDate(itemJson.publicationDate || itemJson.year || itemJson.publicationYear),
            description: String(itemJson.description || itemJson.summary || ''),
            notes: String(itemJson.notes || ''),
            imageUrl: String(itemJson.imageUrl || itemJson.image || itemJson.coverImage || itemJson.cover || ''),
            tags: Array.isArray(itemJson.tags) ? itemJson.tags.map(String) : (typeof itemJson.tags === 'string' ? itemJson.tags.split(',').map(t => t.trim()) : []),
            originalFileFormats: Array.isArray(itemJson.originalFileFormats) ? itemJson.originalFileFormats.map(String) : [],
            originalName: itemJson.isOriginalNameNA ? 'N/A' : String(itemJson.originalName || ''),
            isOriginalNameNA: typeof itemJson.isOriginalNameNA === 'boolean' ? itemJson.isOriginalNameNA : false,
            calibredStatus: ['yes', 'no', 'na'].includes(itemJson.calibredStatus) ? itemJson.calibredStatus : 'no',
          };

          if (!mappedItem.title) {
            console.error("JSON object must have a 'title' or 'name' field:", itemJson);
            return false;
          }

          if (mappedItem.author === 'undefined' || mappedItem.author === 'null') mappedItem.author = '';
          if (mappedItem.description === 'undefined' || mappedItem.description === 'null') mappedItem.description = '';
          if (mappedItem.notes === 'undefined' || mappedItem.notes === 'null') mappedItem.notes = '';
          if (mappedItem.imageUrl === 'undefined' || mappedItem.imageUrl === 'null') mappedItem.imageUrl = '';

          addItem(mappedItem);
          return true;
        };

        if (Array.isArray(jsonData)) {
          jsonData.forEach(itemJson => {
            if (processJsonObject(itemJson)) {
              successfullyImportedCount++;
            } else {
              failedImportCount++;
            }
          });
        } else if (typeof jsonData === 'object' && jsonData !== null) {
          if (processJsonObject(jsonData)) {
            successfullyImportedCount++;
          } else {
            failedImportCount++;
          }
        } else {
          throw new Error("JSON file must contain a single object or an array of objects representing items.");
        }

        if (successfullyImportedCount > 0 && failedImportCount === 0) {
          toast({
            title: successfullyImportedCount === 1 ? "Item Imported" : "Items Imported",
            description: `${successfullyImportedCount} item(s) successfully imported from JSON.`,
          });
        } else if (successfullyImportedCount > 0 && failedImportCount > 0) {
          toast({
            title: "Partial Import Success",
            description: `${successfullyImportedCount} item(s) imported, ${failedImportCount} item(s) failed. Check console for details.`,
            variant: "default", 
          });
        } else if (failedImportCount > 0) {
           throw new Error(`All ${failedImportCount} item(s) failed to import. Check console for details.`);
        } else {
           throw new Error("No items found or processed in the JSON file.");
        }

      } catch (error: any) {
        toast({
          title: "JSON Import Failed",
          description: error.message || "Could not import item(s) from the JSON file.",
          variant: "destructive",
        });
      } finally {
        if (jsonImportFileInputRef.current) {
          jsonImportFileInputRef.current.value = ''; 
        }
      }
    };
    reader.onerror = () => {
       toast({
        title: "File Read Error",
        description: "Could not read the selected file.",
        variant: "destructive",
      });
      if (jsonImportFileInputRef.current) {
        jsonImportFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        onAddItemClick={handleAddItemClick}
        onBackupClick={() => {
          backupData();
          toast({ title: "Backup Initiated", description: "Your library data is being downloaded." });
        }}
        onRestoreClick={handleRestoreClick}
        onImportJsonItemClick={handleImportJsonItemClick}
      />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title and/or author"
            value={searchTerm}
            onChange={handleSearchInputChange}
            className="pl-10 pr-10 w-full max-w-lg shadow-sm text-base"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Sort By:</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={sortOption === 'createdAt' ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                onClick={() => setSortOption('createdAt')}
              >
                <History className="mr-2 h-4 w-4" />
                Added Date
              </Badge>
              <Badge
                variant={sortOption === 'title' ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                onClick={() => setSortOption('title')}
              >
                <CaseSensitive className="mr-2 h-4 w-4" />
                Alphabetically
              </Badge>
            </div>
             <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
             <div className="flex items-center gap-2">
                <Badge
                variant={sortDirection === 'asc' ? 'secondary' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                onClick={() => setSortDirection('asc')}
                >
                <ArrowUp className="mr-2 h-4 w-4" />
                Ascending
                </Badge>
                <Badge
                variant={sortDirection === 'desc' ? 'secondary' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                onClick={() => setSortDirection('desc')}
                >
                <ArrowDown className="mr-2 h-4 w-4" />
                Descending
                </Badge>
            </div>
        </div>

        {allTags && allTags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-lg font-semibold text-foreground">Available Tags:</h2>
              <Button variant="outline" size="sm" onClick={() => setIsTagManagerOpen(true)}>
                <Tags className="mr-2 h-4 w-4" />
                Manage Tags
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={activeTags.has(tag) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                  onClick={() => handleTagPillClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-6">
          {!isLoading && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                ({inventoryItems.length}) {inventoryItems.length === 1 ? 'Item' : 'Items'}
              </h2>
            </div>
          )}
          <InventoryGrid
            items={inventoryItems}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItemClick}
            isLoading={isLoading}
          />
        </div>
      </main>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelectedForRestore}
        accept=".json"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonImportFileInputRef}
        onChange={handleFileSelectedForJsonImport}
        accept=".json"
        className="hidden"
      />

      <InventoryForm
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        key={editingItem ? `edit-${editingItem.id}-${JSON.stringify(editingItem.originalFileFormats?.slice().sort() || [])}` : 'add-new'}
        availableGlobalTags={allTags}
        onAddGlobalTag={addNewGlobalTag}
        currentPage={formCurrentPage}
        onPageChange={setFormCurrentPage}
      />

      <TagManager
        isOpen={isTagManagerOpen}
        onOpenChange={setIsTagManagerOpen}
        allTags={allTags}
        onAddTag={addNewGlobalTag}
        onUpdateTag={updateGlobalTag}
        onDeleteTag={deleteGlobalTag}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{inventoryItems.find(i => i.id === itemToDelete)?.title || 'this item'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore data from "{fileToRestore?.name || 'the selected file'}"?
              This will overwrite your current library. An automatic backup of your current data will be created first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowRestoreConfirm(false); setFileToRestore(null); if(fileInputRef.current) fileInputRef.current.value = '';}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestoreData}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border bg-secondary">
        Stockpile &copy; {new Date().getFullYear()} - Your Comic/Book Library
      </footer>
    </div>
  );

    



    

    

