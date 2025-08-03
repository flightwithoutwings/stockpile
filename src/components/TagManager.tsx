
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, PlusCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface TagManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allTags: string[];
  onAddTag: (tag: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ isOpen, onOpenChange, allTags, onAddTag, onUpdateTag, onDeleteTag }) => {
  const { toast } = useToast();
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim().toLowerCase();
    if (trimmedTag && !allTags.includes(trimmedTag)) {
      onAddTag(trimmedTag);
      setNewTagInput('');
      toast({ title: 'Tag Added', description: `Tag "${trimmedTag}" has been created.` });
    } else if (allTags.includes(trimmedTag)) {
      toast({ title: 'Tag Exists', description: `Tag "${trimmedTag}" already exists.`, variant: 'destructive' });
    }
  };

  const handleEditClick = (tag: string) => {
    setEditingTag(tag);
    setEditingValue(tag);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingValue('');
  };

  const handleSaveEdit = (oldTag: string) => {
    const trimmedNewTag = editingValue.trim().toLowerCase();
    if (!trimmedNewTag) {
        toast({ title: 'Invalid Tag', description: 'Tag name cannot be empty.', variant: 'destructive' });
        return;
    }
    if (allTags.includes(trimmedNewTag) && trimmedNewTag !== oldTag) {
      toast({ title: 'Tag Exists', description: `Tag "${trimmedNewTag}" already exists.`, variant: 'destructive' });
      return;
    }
    onUpdateTag(oldTag, trimmedNewTag);
    toast({ title: 'Tag Updated', description: `Tag "${oldTag}" was renamed to "${trimmedNewTag}".` });
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if(tagToDelete) {
        onDeleteTag(tagToDelete);
        toast({ title: 'Tag Deleted', description: `Tag "${tagToDelete}" and all its associations have been removed.`, variant: 'destructive' });
        setTagToDelete(null);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Universal Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Create new universal tag"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
            />
            <Button type="button" size="sm" onClick={handleAddTag} disabled={!newTagInput.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <ScrollArea className="h-64 w-full rounded-md border p-2">
            {allTags.length > 0 ? (
              <div className="space-y-2">
                {allTags.map((tag) => (
                  <div key={tag} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    {editingTag === tag ? (
                      <div className="flex-grow flex items-center gap-2">
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(tag); } }}
                          className="h-8"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => handleSaveEdit(tag)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-sm">{tag}</Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(tag)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setTagToDelete(tag)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No universal tags created yet.</p>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tag?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the universal tag 
                "{tagToDelete}" and remove it from all items in your library.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel onClick={() => setTagToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete Tag
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default TagManager;
