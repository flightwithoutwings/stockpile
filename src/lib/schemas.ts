
import { z } from 'zod';

export const inventoryItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title must be 150 characters or less"),
  author: z.string().max(250, "Author must be 250 characters or less").optional(),
  publicationDate: z.date().optional(),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
  notes: z.string().max(5000, "Notes must be 5000 characters or less").optional(),
  imageUrl: z.string().optional().or(z.literal('')), // Allow empty string or valid (data)URL
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(25, "Tag must be 25 characters or less")).max(10, "Maximum of 10 tags allowed").optional().default([]),
  originalFileFormats: z.array(z.string().max(50, "Format name too long")).max(6, "Maximum of 6 formats allowed").optional().default([]),
  originalName: z.string().max(200, "Original name must be 200 characters or less").optional(),
  isOriginalNameNA: z.boolean().optional().default(false),
  calibredStatus: z.enum(['yes', 'no', 'na']).optional().default('no'),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;
