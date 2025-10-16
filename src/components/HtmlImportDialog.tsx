
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileCode } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface HtmlImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFileSubmit: (file: File) => void;
}

const HtmlImportDialog: React.FC<HtmlImportDialogProps> = ({ isOpen, onOpenChange, onFileSubmit }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const processFile = useCallback((file: File) => {
    if (file.type === 'text/html') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload an HTML file (.html).",
        variant: "destructive"
      });
      setSelectedFile(null);
    }
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleSubmit = () => {
    if (selectedFile) {
        onFileSubmit(selectedFile);
        onOpenChange(false);
    } else {
        toast({
            title: "No file selected",
            description: "Please select an HTML file to import.",
            variant: "destructive"
        });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from HTML</DialogTitle>
          <DialogDescription>
            Select or drop an HTML file to import items into your library.
          </DialogDescription>
        </DialogHeader>
        <div
          className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-ai-hint="html file upload area"
        >
          <div className="space-y-1 text-center">
            {selectedFile ? (
                <>
                    <FileCode className="mx-auto h-12 w-12 text-primary" />
                    <p className="font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(selectedFile.size / 1024)} KB</p>
                </>
            ) : (
                <>
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground">
                        <Label
                            htmlFor="html-file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                        >
                        <span>Upload a file</span>
                        </Label>
                        <input id="html-file-upload" name="html-file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept=".html,text/html" />
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">HTML files only</p>
                </>
            )}
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={!selectedFile}>
            Import File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HtmlImportDialog;
