import { getBookFile } from "../../../services/bookFileStorage.js";
import { getBookFileById } from "../repositories/bookFilesRepository.js";
import { getLibraryMembership, getLibraryBook } from "../../libraries/repositories/librariesRepository.js";
import { getFilesByLibraryBookId } from "../repositories/bookFilesRepository.js";

export const getBookFilesService = async (
  userId: string,
  libraryId: string,
  bookId: string,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const libraryBook = await getLibraryBook(libraryId, bookId);

  if (!libraryBook) {
    throw new Error("Book not found in this library");
  }

  const files = await getFilesByLibraryBookId(libraryBook.id);

  return files.map((file) => ({
    ...file,
    sizeBytes: file.sizeBytes.toString(),
  }));
};

import { assertCanEditLibraryBookService } from "../../libraries/services/librariesService.js";
import { detectEbookFormat } from "../utils/detectEbookFormat.js";
import { uploadBookFile, deleteBookFile } from "../../../services/bookFileStorage.js";
import { createBookFile } from "../repositories/bookFilesRepository.js";

const EBOOK_MIME_TYPES = {
  EPUB: "application/epub+zip",
  FB2: "application/xml",
  PDF: "application/pdf",
} as const;

export const addBookFileService = async (
  userId: string,
  libraryId: string,
  bookId: string,
  file: Express.Multer.File,
) => {
  const libraryBook = await assertCanEditLibraryBookService(
    userId,
    libraryId,
    bookId,
  );

  const format = await detectEbookFormat(
    file.buffer,
    file.originalname,
  );

  const mimeType = EBOOK_MIME_TYPES[format];

  const storageKey = await uploadBookFile({
    libraryBookId: libraryBook.id,
    buffer: file.buffer,
    mimeType,
  });

  try {
    const savedFile = await createBookFile({
      libraryBookId: libraryBook.id,
      uploadedById: userId,
      format,
      fileName: file.originalname,
      storageKey,
      mimeType,
      sizeBytes: BigInt(file.size),
    });

    return {
      ...savedFile,
      sizeBytes: savedFile.sizeBytes.toString(),
    };
  } catch (error) {
    try {
      await deleteBookFile(storageKey);
    } catch (cleanupError) {
      console.error("Failed to clean up R2 book file:", {
        storageKey,
        cleanupError,
      });
    }

    throw error;
  }
};

export const downloadBookFileService = async (
  userId: string,
  libraryId: string,
  bookId: string,
  fileId: string,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const libraryBook = await getLibraryBook(libraryId, bookId);

  if (!libraryBook) {
    throw new Error("Book not found in this library");
  }

  const file = await getBookFileById(fileId, libraryBook.id);

  if (!file) {
    throw new Error("Book file not found");
  }

  const stream = await getBookFile(file.storageKey);

  return {
    stream,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes.toString(),
  };
};
