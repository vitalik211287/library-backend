import { z } from "zod";

export const createBookSchema = z.object({
  isbn: z
    .string()
    .regex(/^(\d{10}|\d{13})$/, "ISBN must contain 10 or 13 digits")
    .optional(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  pages: z.number().int().positive().optional(),
  language: z.string().optional(),
  coverUrl: z.string().url().optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
});

export const updateBookSchema = z
  .object({
    isbn: z.string().optional(),
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    publisher: z.string().optional(),
    year: z.number().int().positive().optional(),
    pages: z.number().int().positive().optional(),
    genre: z.string().optional(),
    language: z.string().optional(),
    description: z.string().optional(),
    coverUrl: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });