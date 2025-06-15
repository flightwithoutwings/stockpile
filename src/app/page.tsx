
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import InventoryGrid from '@/components/InventoryGrid';
import InventoryForm from '@/components/InventoryForm';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/hooks/useInventory';
import type { InventoryItem } from '@/lib/types';
import type { InventoryItemFormValues } from '@/lib/schemas';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const {
    items: inventoryItems,
    addItem,
    updateItem,
    deleteItem,
    searchTerm,
    setSearchTerm,
    backupData,
    restoreData,
    isLoading,
    allTags,
    addNewGlobalTag,
  } = useInventory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formCurrentPage, setFormCurrentPage] = useState(1);

  const [activeSearchPills, setActiveSearchPills] = useState<Set<string>>(new Set());

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
    const currentSearchText = event.target.value;
    setSearchTerm(currentSearchText);

    const termsInInput = currentSearchText.toLowerCase().split(' ').filter(t => t.trim() !== '');
    const newActivePillsFromInput = new Set<string>();
    allTags.forEach(tag => {
      if (termsInInput.includes(tag)) {
        newActivePillsFromInput.add(tag);
      }
    });
    setActiveSearchPills(newActivePillsFromInput);
  };

  const handleTagPillClick = useCallback((tagToToggle: string) => {
    const newActivePills = new Set(activeSearchPills);
    if (newActivePills.has(tagToToggle)) {
      newActivePills.delete(tagToToggle);
    } else {
      newActivePills.add(tagToToggle);
    }
    setActiveSearchPills(newActivePills);
    setSearchTerm(Array.from(newActivePills).join(' '));
  }, [activeSearchPills, setSearchTerm]);


  useEffect(() => {
    const termsInCurrentSearch = searchTerm.toLowerCase().split(' ').filter(t => t.trim() !== '');
    const initialPills = new Set<string>();
    allTags.forEach(tag => {
      if (termsInCurrentSearch.includes(tag)) {
        initialPills.add(tag);
      }
    });
    setActiveSearchPills(initialPills);
  }, [searchTerm, allTags]);


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


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        onAddItemClick={handleAddItemClick}
        onBackupClick={() => {
          backupData();
          toast({ title: "Backup Initiated", description: "Your library data is being downloaded." });
        }}
        onRestoreClick={handleRestoreClick}
      />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, author, tag, year or description..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            className="pl-10 w-full max-w-lg shadow-sm text-base"
          />
        </div>

        {allTags && allTags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Available Tags:</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={activeSearchPills.has(tag) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent/20 transition-colors rounded-md"
                  onClick={() => handleTagPillClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <InventoryGrid
          items={inventoryItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItemClick}
          isLoading={isLoading}
        />
      </main>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelectedForRestore}
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

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{inventoryItems.find(i => i.id === itemToDelete)?.title || 'this item'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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
}
