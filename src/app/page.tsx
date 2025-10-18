
'use client';

import React, { useState, useRef, useEffect } from 'react';
import AppHeader, { type ExportType } from '@/components/AppHeader';
import InventoryGrid from '@/components/InventoryGrid';
import InventoryForm from '@/components/InventoryForm';
import TagManager from '@/components/TagManager';
import SearchBar from '@/components/SearchBar';
import { useInventory } from '@/hooks/useInventory';
import type { InventoryItem, ScrapedItemData } from '@/lib/types';
import type { InventoryItemFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Pagination from '@/components/Pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import HtmlImportDialog from '@/components/HtmlImportDialog';
import { parseHtmlContent } from '@/lib/html-parser';

export default function HomePage() {
  const {
    items: inventoryItems,
    addItem,
    updateItem,
    deleteItem,
    setSearchTerm,
    activeTags,
    toggleTagInFilter,
    backupData,
    restoreData,
    isLoading: isInitialLoading,
    isPaginating,
    allTags,
    addNewGlobalTag,
    updateGlobalTag,
    deleteGlobalTag,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
    totalFilteredItems,
    searchTerm,
    searchField,
    setSearchField,
  } = useInventory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isHtmlImportOpen, setIsHtmlImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportFileInputRef = useRef<HTMLInputElement>(null);
  const [formCurrentPage, setFormCurrentPage] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  const handlePageChange = (page: number) => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]')?.scrollTo(0, 0);
    }
    setCurrentPage(page);
  };

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

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleExportClick = (type: ExportType) => {
    backupData(type);
    toast({ title: "Backup Initiated", description: "Your library data is being downloaded." });
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
            imageURI: String(itemJson.imageURI || ''),
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
  
  const handleHtmlFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const htmlContent = e.target?.result as string;
        if (!htmlContent) {
          throw new Error('File is empty or could not be read.');
        }

        const { data, error } = parseHtmlContent(htmlContent, file.name);

        if (error) {
          throw new Error(error);
        }

        if (data) {
          toast({
            title: 'Content Parsed',
            description: `Successfully extracted data for "${data.title}".`,
          });
          
          let notesContent = '';
          if (data.printLength && data.printLength !== 'Print length not found') {
            notesContent += `Print Length: ${data.printLength}\n`;
          }
          if (data.fileSize && data.fileSize !== 'File size not found') {
            notesContent += `File Size: ${data.fileSize}\n`;
          }

          const parsedDate = data.year ? new Date(data.year) : undefined;
          const publicationDate = (parsedDate && !isNaN(parsedDate.getTime())) ? parsedDate : undefined;

          // Create a temporary item object to pre-fill the form
          const tempItem: InventoryItem = {
            id: '', // No ID yet, it's a new item
            title: data.title || '',
            author: data.author || '',
            description: data.description || '',
            publicationDate: publicationDate,
            imageUrl: data.imageUrl || '',
            notes: notesContent.trim(),
            // Empty defaults for fields not parsed
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
            imageURI: '',
            originalFileFormats: [],
            originalName: '',
            isOriginalNameNA: false,
            calibredStatus: 'no',
          };

          setEditingItem(tempItem); // Use setEditingItem to pre-fill the form
          setFormCurrentPage(1);
          setIsFormOpen(true);
        }
      } catch (error: any) {
        toast({
          title: 'HTML Import Failed',
          description: error.message || 'Could not parse the HTML file.',
          variant: 'destructive',
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'An error occurred while trying to read the file.',
        variant: 'destructive',
      });
    };
    reader.readAsText(file);
    setIsHtmlImportOpen(false);
  };


  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader
        onAddItemClick={handleAddItemClick}
        onExportClick={handleExportClick}
        onRestoreClick={handleRestoreClick}
        onImportJsonItemClick={handleImportJsonItemClick}
        onImportHtmlItemClick={() => setIsHtmlImportOpen(true)}
      />
      <main className="flex-1 container mx-auto px-4 flex flex-col min-h-0">
        <div className="py-6 bg-background">
          <SearchBar
            initialSearchTerm={searchTerm}
            onSearch={setSearchTerm}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            allTags={allTags}
            activeTags={activeTags}
            onTagToggle={toggleTagInFilter}
            onManageTagsClick={() => setIsTagManagerOpen(true)}
          />
        </div>
        
        <div className="border-t border-border flex-1 flex flex-col min-h-0">
           <div className="pt-6 pb-4 bg-background">
            {!isInitialLoading && (
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Items Total: {totalFilteredItems}
                </h2>
                <Separator orientation="vertical" className="h-6" />
                <h2 className="text-lg font-semibold text-foreground">
                  Items on this page: {inventoryItems.length}
                </h2>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 -mr-4 pr-4" ref={scrollAreaRef}>
            <InventoryGrid
              items={inventoryItems}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItemClick}
              isLoading={isInitialLoading || isPaginating}
            />
          </ScrollArea>
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
        key={editingItem ? `edit-${editingItem.id}-${editingItem.updatedAt}` : 'add-new'}
        availableGlobalTags={allTags}
        onAddGlobalTag={addNewGlobalTag}
        currentPage={formCurrentPage}
        onPageChange={setFormCurrentPage}
      />
      
      <HtmlImportDialog
        isOpen={isHtmlImportOpen}
        onOpenChange={setIsHtmlImportOpen}
        onFileSubmit={handleHtmlFileImport}
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
      
      {totalPages > 1 && (
        <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border z-40">
            <div className="container mx-auto px-4 py-3 flex items-center justify-center">
                <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                />
            </div>
        </footer>
      )}

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border bg-secondary shrink-0">
        Stockpile &copy; {new Date().getFullYear()} - Your Comic/Book Library
      </footer>
    </div>
  );
}
