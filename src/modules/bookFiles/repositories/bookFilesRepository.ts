import prisma from "../../../utils/prisma.js";

export const getFilesByLibraryBookId = (libraryBookId: string) =>
  prisma.bookFile.findMany({
    where: { libraryBookId },
    select: {
      id: true,
      format: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedById: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

export const createBookFile = (data: {
  libraryBookId: string;
  uploadedById: string;
  format: "EPUB" | "FB2" | "PDF";
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: bigint;
}) =>
  prisma.bookFile.create({
    data,
    select: {
      id: true,
      format: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedById: true,
      createdAt: true,
    },
  });

export const getBookFileById = (
  fileId: string,
  libraryBookId: string,
) =>
  prisma.bookFile.findFirst({
    where: {
      id: fileId,
      libraryBookId,
    },
    select: {
      id: true,
      fileName: true,
      format: true,
      mimeType: true,
      sizeBytes: true,
      storageKey: true,
    },
  });
