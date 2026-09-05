import type { Request, Response } from "express";

import type { LibraryRole } from "@prisma/client";

import cloudinary from "../../../config/cloudinary.js";

import {
  addBookToLibraryService,
  addLibraryMemberService,
  assertCanAddBookToLibraryService,
  assertCanEditLibraryBookService,
  createLibraryService,
  deleteLibraryService,
  getLibraryBookService,
  getLibraryBooksService,
  getLibraryMembersService,
  getMyLibrariesService,
  removeLibraryMemberService,
  updateLibraryBookCoverService,
  updateLibraryBookService,
  updateLibraryMemberRoleService,
  updateLibraryService,
} from "../services/librariesService.js";

const LIBRARY_ROLES: LibraryRole[] = ["OWNER", "ADMIN", "MEMBER"];

const handleLibraryManagementError = (error: unknown, res: Response) => {
  if (!(error instanceof Error)) {
    return res.status(500).json({
      message: "Library management failed",
    });
  }

  if (
    error.message === "You do not have permission" ||
    error.message === "Only an owner can delete the library"
  ) {
    return res.status(403).json({
      message: error.message,
    });
  }

  if (
    error.message === "Library not found" ||
    error.message === "Library member not found" ||
    error.message === "User not found" ||
    error.message === "Book not found in this library"
  ) {
    return res.status(404).json({
      message: error.message,
    });
  }

  return res.status(400).json({
    message: error.message,
  });
};

/* =========================
   LIBRARIES
========================= */

export const getMyLibrariesController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const libraries = await getMyLibrariesService(userId);

    return res.status(200).json(libraries);
  } catch (error) {
    console.error("Get libraries error:", error);

    return res.status(500).json({
      message: "Failed to get libraries",
    });
  }
};

export const createLibraryController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Library name is required",
      });
    }

    const library = await createLibraryService(userId, name);

    return res.status(201).json(library);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create library",
    });
  }
};

export const updateLibraryController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const { libraryId } = req.params;

    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryId || typeof libraryId !== "string") {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Library name is required",
      });
    }

    const library = await updateLibraryService(userId, libraryId, name);

    return res.status(200).json(library);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

export const deleteLibraryController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const { libraryId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryId || typeof libraryId !== "string") {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    await deleteLibraryService(userId, libraryId);

    return res.status(204).send();
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

/* =========================
   MEMBERS
========================= */

export const addLibraryMemberController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId } = req.params;

    const { email } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryId || typeof libraryId !== "string") {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const member = await addLibraryMemberService(userId, libraryId, email);

    return res.status(201).json(member);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

export const getLibraryMembersController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryId || typeof libraryId !== "string") {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const members = await getLibraryMembersService(userId, libraryId);

    return res.status(200).json(members);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

export const updateLibraryMemberRoleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId, memberUserId } = req.params;

    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !libraryId ||
      typeof libraryId !== "string" ||
      !memberUserId ||
      typeof memberUserId !== "string"
    ) {
      return res.status(400).json({
        message: "Library ID and member user ID are required",
      });
    }

    if (
      typeof role !== "string" ||
      !LIBRARY_ROLES.includes(role as LibraryRole)
    ) {
      return res.status(400).json({
        message: "Invalid library role",
      });
    }

    const member = await updateLibraryMemberRoleService(
      userId,
      libraryId,
      memberUserId,
      role as LibraryRole,
    );

    return res.status(200).json(member);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

export const removeLibraryMemberController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId, memberUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !libraryId ||
      typeof libraryId !== "string" ||
      !memberUserId ||
      typeof memberUserId !== "string"
    ) {
      return res.status(400).json({
        message: "Library ID and member user ID are required",
      });
    }

    await removeLibraryMemberService(userId, libraryId, memberUserId);

    return res.status(204).send();
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

/* =========================
   BOOKS
========================= */

export const getLibraryBooksController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryId || typeof libraryId !== "string") {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    const books = await getLibraryBooksService(userId, libraryId);

    return res.status(200).json(books);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

/* =========================
   ONE BOOK
========================= */

export const getLibraryBookController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const { libraryId, bookId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !libraryId ||
      typeof libraryId !== "string" ||
      !bookId ||
      typeof bookId !== "string"
    ) {
      return res.status(400).json({
        message: "Library ID and book ID are required",
      });
    }

    const book = await getLibraryBookService(userId, libraryId, bookId);

    return res.status(200).json(book);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

/* =========================
   ADD BOOK
========================= */

export const addBookToLibraryController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryId || typeof libraryId !== "string") {
      return res.status(400).json({
        message: "Library ID is required",
      });
    }

    /*
     * Перевіряємо членство
     * та дубль ДО Cloudinary.
     */
    await assertCanAddBookToLibraryService(userId, libraryId, req.body.isbn);

    let coverUrl: string | undefined;

    if (req.file) {
      const result = await new Promise<{
        secure_url: string;
      }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "library/covers",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);

              return;
            }

            if (!result) {
              reject(new Error("Cloudinary upload failed"));

              return;
            }

            resolve({
              secure_url: result.secure_url,
            });
          },
        );

        uploadStream.end(req.file?.buffer);
      });

      coverUrl = result.secure_url;
    }

    const book = await addBookToLibraryService(
      userId,
      libraryId,
      req.body,
      coverUrl,
    );

    return res.status(201).json(book);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Library not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Book already exists in library") {
        return res.status(409).json({
          message: error.message,
        });
      }
    }

    console.error("Add book to library error:", error);

    return res.status(500).json({
      message: "Failed to add book to library",
    });
  }
};

/* =========================
   UPDATE BOOK
========================= */

export const updateLibraryBookController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId, bookId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !libraryId ||
      typeof libraryId !== "string" ||
      !bookId ||
      typeof bookId !== "string"
    ) {
      return res.status(400).json({
        message: "Library ID and book ID are required",
      });
    }

    const book = await updateLibraryBookService(
      userId,
      libraryId,
      bookId,
      req.body,
    );

    return res.status(200).json(book);
  } catch (error) {
    return handleLibraryManagementError(error, res);
  }
};

/* =========================
   UPDATE BOOK COVER
========================= */

export const updateLibraryBookCoverController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    const { libraryId, bookId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !libraryId ||
      typeof libraryId !== "string" ||
      !bookId ||
      typeof bookId !== "string"
    ) {
      return res.status(400).json({
        message: "Library ID and book ID are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Cover file is required",
      });
    }

    /*
     * Permission ДО Cloudinary.
     */
    await assertCanEditLibraryBookService(userId, libraryId, bookId);

    const result = await new Promise<{
      secure_url: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "library/covers",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);

            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload failed"));

            return;
          }

          resolve({
            secure_url: result.secure_url,
          });
        },
      );

      uploadStream.end(req.file?.buffer);
    });

    const book = await updateLibraryBookCoverService(
      userId,
      libraryId,
      bookId,
      result.secure_url,
    );

    return res.status(200).json(book);
  } catch (error) {
    console.error("Update library book cover error:", error);

    return handleLibraryManagementError(error, res);
  }
};

