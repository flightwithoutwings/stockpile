
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inventoryItemSchema, type InventoryItemFormValues } from '@/lib/schemas';
import type { InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, UploadCloud, Trash2, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';


interface InventoryFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: InventoryItemFormValues, itemId?: string) => void;
  initialData?: InventoryItem | null;
  availableGlobalTags?: string[];
  onAddGlobalTag?: (tag: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const TOTAL_PAGES = 4;

const fixedFormatOptions = ["AZW3", "AZW", "EPUB", "KOBO", "MOBI", "OTHER"];

const InventoryForm: React.FC<InventoryFormProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  availableGlobalTags = [],
  onAddGlobalTag,
  currentPage,
  onPageChange,
}) => {
  const { toast } = useToast();
  const [currentTags, setCurrentTags] = useState<string[]>(initialData?.tags || []);
  const [newGlobalTagInput, setNewGlobalTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          author: initialData.author || '',
          publicationDate: initialData.publicationDate,
          description: initialData.description || '',
          imageUrl: initialData.imageUrl || '',
          tags: initialData.tags || [],
          originalFileFormats: initialData.originalFileFormats || [],
          originalName: initialData.originalName || '',
          isOriginalNameNA: initialData.isOriginalNameNA || false,
          calibredStatus: initialData.calibredStatus || 'no',
        }
      : {
          title: '',
          author: '',
          publicationDate: undefined,
          description: '',
          imageUrl: '',
          tags: [],
          originalFileFormats: [],
          originalName: '',
          isOriginalNameNA: false,
          calibredStatus: 'no',
        },
  });

  const { fields: formatFields, append: appendFormat, remove: removeFormat } = useFieldArray({
    control: form.control,
    name: "originalFileFormats",
  });

  const watchIsOriginalNameNA = form.watch('isOriginalNameNA');
  const originalNameValue = form.watch('originalName');

  useEffect(() => {
    if (watchIsOriginalNameNA) {
      if (originalNameValue !== 'N/A') {
        form.setValue('originalName', 'N/A', { shouldValidate: true });
      }
    }
  }, [watchIsOriginalNameNA, form, originalNameValue]);

  useEffect(() => {
    if (isOpen) {
      const tags = initialData?.tags || [];
      const formats = initialData?.originalFileFormats || [];
      form.reset(
        initialData
          ? {
              title: initialData.title,
              author: initialData.author || '',
              publicationDate: initialData.publicationDate,
              description: initialData.description || '',
              imageUrl: initialData.imageUrl || '',
              tags: tags,
              originalFileFormats: formats,
              originalName: initialData.originalName || '',
              isOriginalNameNA: initialData.isOriginalNameNA || false,
              calibredStatus: initialData.calibredStatus || 'no',
            }
          : {
              title: '',
              author: '',
              publicationDate: undefined,
              description: '',
              imageUrl: '',
              tags: [],
              originalFileFormats: [],
              originalName: '',
              isOriginalNameNA: false,
              calibredStatus: 'no',
            }
      );
      setCurrentTags(tags);
      setImagePreview(initialData?.imageUrl || null);
      setNewGlobalTagInput('');
    }
  }, [isOpen, initialData, form]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setImagePreview(result);
          form.setValue('imageUrl', result, { shouldValidate: true });
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please upload an image file (PNG, JPG, GIF).", variant: "destructive" });
      }
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (currentPage !== 2) return;

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setImagePreview(result);
          form.setValue('imageUrl', result, { shouldValidate: true });
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Invalid File", description: "Please drop an image file.", variant: "destructive" });
      }
      event.dataTransfer.clearData();
    }
  }, [form, toast, currentPage]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const toggleTag = (tagToToggle: string) => {
    const tag = tagToToggle.trim().toLowerCase();
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    if (!currentTags.includes(tag) && newTags.length > 10) {
        toast({
            title: "Tag limit reached",
            description: "You can add a maximum of 10 tags per item.",
            variant: "destructive",
        });
        return;
    }

    setCurrentTags(newTags);
    form.setValue('tags', newTags, { shouldValidate: true });
  };

  const handleAddGlobalTag = () => {
    const tag = newGlobalTagInput.trim().toLowerCase();
    if (tag && onAddGlobalTag) {
      onAddGlobalTag(tag);
      if (!currentTags.includes(tag) && currentTags.length < 10) {
         toggleTag(tag);
      } else if (currentTags.length >= 10 && !currentTags.includes(tag)) {
          toast({
            title: "Tag limit reached for item",
            description: "Cannot auto-select new universal tag. Item already has 10 tags.",
            variant: "destructive",
        });
      }
      setNewGlobalTagInput('');
    }
  };


  const handleSubmit = (values: InventoryItemFormValues) => {
    const submissionData = {
        ...values,
        author: values.author || '',
        description: values.description || '',
        tags: currentTags
    };
    onSubmit(submissionData, initialData?.id);
    toast({
      title: initialData ? "Item Updated" : "Item Added",
      description: `"${values.title}" has been successfully ${initialData ? 'updated' : 'added'}.`,
    });
    onOpenChange(false);
  };

  const nextPage = async () => {
    let isValid = true;
    if (currentPage === 1) {
        isValid = await form.trigger(['title', 'author', 'publicationDate', 'description']);
    } else if (currentPage === 2) {
        isValid = await form.trigger(['imageUrl']);
    } else if (currentPage === 3) {
        isValid = await form.trigger(['originalFileFormats', 'originalName', 'isOriginalNameNA', 'calibredStatus']);
    } else if (currentPage === 4) {
        isValid = await form.trigger(['tags']);
    }

    if (!isValid && currentPage < TOTAL_PAGES) {
        toast({
            title: "Validation Error",
            description: "Please correct the errors on the current page before proceeding.",
            variant: "destructive",
        });
        return;
    }
    if (isValid) {
       onPageChange(prev => Math.min(prev + 1, TOTAL_PAGES));
    }
  };

  const prevPage = () => {
    onPageChange(prev => Math.max(prev - 1, 1));
  };
  
  const handleTabChange = (value: string) => {
    const pageNumber = parseInt(value.replace('page', ''), 10);
    onPageChange(pageNumber);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg md:max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="truncate pr-8">{initialData ? `Edit Item: ${initialData.title}` : 'Add New Item'}</DialogTitle>
           <Tabs value={`page${currentPage}`} onValueChange={handleTabChange} className="w-full pt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="page1">Details</TabsTrigger>
              <TabsTrigger value="page2">Image</TabsTrigger>
              <TabsTrigger value="page3">File Info</TabsTrigger>
              <TabsTrigger value="page4">Tags</TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-6">
                {currentPage === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., The Legend of Korra: Patterns in Time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author(s) (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Michael Dante DiMartino" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="publicationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Publication Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief summary or notes about the item" {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentPage === 2 && (
                  <>
                    <div>
                      <FormLabel>Item Image</FormLabel>
                      <div
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        data-ai-hint="image upload area"
                      >
                        <div className="space-y-1 text-center">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="mx-auto h-40 w-auto object-contain rounded" />
                          ) : (
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                          )}
                          <div className="flex text-sm text-muted-foreground">
                            <Label
                              htmlFor="file-upload-input"
                              className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                            >
                              <span>Upload a file</span>
                            </Label>
                            <input id="file-upload-input" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" />
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormLabel className="text-xs">Or enter Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/image.jpg"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (!fileInputRef.current?.files?.length) {
                                    setImagePreview(e.target.value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {currentPage === 3 && (
                  <>
                    <FormItem>
                      <FormLabel>File Formats (up to 6 for this item)</FormLabel>
                      <div className="space-y-2">
                        {formatFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`originalFileFormats.${index}`}
                              render={({ field: selectField }) => (
                                <FormItem className="flex-grow">
                                   <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a format" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {fixedFormatOptions.map(formatOption => (
                                        <SelectItem key={formatOption} value={formatOption}>
                                          {formatOption}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => removeFormat(index)} aria-label="Remove format">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                       {form.formState.errors.originalFileFormats && <FormMessage>{(form.formState.errors.originalFileFormats as any)?.root?.message || (form.formState.errors.originalFileFormats as any).message}</FormMessage>}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendFormat("")}
                        disabled={formatFields.length >= 6}
                        className="mt-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Format to Item
                      </Button>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="originalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Original File Name</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                placeholder="e.g., long string of text and/or numbers"
                                {...field}
                                disabled={watchIsOriginalNameNA}
                                value={watchIsOriginalNameNA ? 'N/A' : field.value}
                              />
                            </FormControl>
                            <FormField
                              control={form.control}
                              name="isOriginalNameNA"
                              render={({ field: switchField }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                      <Switch
                                        checked={switchField.value}
                                        onCheckedChange={(checked) => {
                                          switchField.onChange(checked);
                                          if (checked) {
                                            form.setValue('originalName', 'N/A', { shouldValidate: true });
                                          } else {
                                            if (form.getValues('originalName') === 'N/A') {
                                               form.setValue('originalName', '', { shouldValidate: true });
                                            }
                                          }
                                        }}
                                        id="isOriginalNameNA"
                                      />
                                  </FormControl>
                                  <Label htmlFor="isOriginalNameNA" className="cursor-pointer whitespace-nowrap">N/A</Label>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Calibred</FormLabel>
                      <div className="flex flex-col space-y-2 mt-1">
                        <FormField
                          control={form.control}
                          name="calibredStatus"
                          render={() => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={form.watch('calibredStatus') === 'yes'}
                                  onCheckedChange={(checked) => {
                                    const currentStatus = form.watch('calibredStatus');
                                    if (checked) {
                                      form.setValue('calibredStatus', 'yes', { shouldValidate: true });
                                    } else if (currentStatus === 'yes') { 
                                      form.setValue('calibredStatus', 'no', { shouldValidate: true });
                                    }
                                  }}
                                  id="calibredYes"
                                />
                              </FormControl>
                              <Label htmlFor="calibredYes" className="font-normal cursor-pointer">
                                Yes
                              </Label>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="calibredStatus"
                          render={() => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={form.watch('calibredStatus') === 'na'}
                                  onCheckedChange={(checked) => {
                                    const currentStatus = form.watch('calibredStatus');
                                    if (checked) {
                                      form.setValue('calibredStatus', 'na', { shouldValidate: true });
                                    } else if (currentStatus === 'na') { 
                                       form.setValue('calibredStatus', 'no', { shouldValidate: true });
                                    }
                                  }}
                                  id="calibredNA"
                                />
                              </FormControl>
                              <Label htmlFor="calibredNA" className="font-normal cursor-pointer">
                                N/A
                              </Label>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Controller
                        name="calibredStatus"
                        control={form.control}
                        render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message}</FormMessage> : null}
                      />
                    </FormItem>
                  </>
                )}

                {currentPage === 4 && (
                  <>
                     <FormItem>
                      <FormLabel>Item's Tags (up to 10)</FormLabel>
                      <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md">
                        {currentTags.length > 0 ? currentTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                            {tag}
                          </Badge>
                        )) : <p className="text-xs text-muted-foreground pl-1">No tags selected for this item.</p>}
                      </div>
                       {form.formState.errors.tags && <FormMessage>{(form.formState.errors.tags as any)?.message || (form.formState.errors.tags as any)?.root?.message}</FormMessage>}
                    </FormItem>

                    {onAddGlobalTag && (
                      <FormItem>
                        <FormLabel>Available Universal Tags (Click to add/remove for this item)</FormLabel>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                          <div className="flex flex-wrap gap-1">
                            {availableGlobalTags.map(tag => (
                              <Badge
                                key={tag}
                                variant={currentTags.includes(tag) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-accent/50 px-3 py-1 text-sm"
                                onClick={() => toggleTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {availableGlobalTags.length === 0 && <p className="text-xs text-muted-foreground">No universal tags defined yet. Add one below.</p>}
                          </div>
                        </ScrollArea>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="text"
                            value={newGlobalTagInput}
                            onChange={(e) => setNewGlobalTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGlobalTag();}}}
                            placeholder="Create new universal tag"
                            className="flex-grow"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={handleAddGlobalTag} disabled={!newGlobalTagInput.trim()}>
                             <PlusCircle className="mr-1 h-4 w-4" /> Add Universal Tag
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 pt-4 pb-6 border-t border-border mt-auto">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <div className="flex-grow" />
              {currentPage > 1 && (
                <Button type="button" variant="outline" onClick={prevPage}>
                  Previous
                </Button>
              )}
              {currentPage < TOTAL_PAGES && (
                <Button type="button" onClick={nextPage} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Next
                </Button>
              )}
              {currentPage === TOTAL_PAGES && (
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {initialData ? 'Save Changes' : 'Add Item'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryForm;
