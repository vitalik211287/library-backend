import { z } from "zod";

export const createBookSchema = z.object({
  isbn: z.string().regex(/^\d{13}$/, "ISBN must contain 13 digits"),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  pages: z.number().int().positive().optional(),
  language: z.string().optional(),
  coverUrl: z.string().url().optional(),
  description: z.string().optional(),
});