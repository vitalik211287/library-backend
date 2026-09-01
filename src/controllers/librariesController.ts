import type { Request, Response } from "express";

import {
  addBookToLibraryService,
  addLibraryMemberService,
  createLibraryService,
  getLibraryBooksService,
  getMyLibrariesService,
} from "../services/librariesService.js";

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
    if (error instanceof Error) {
      if (error.message === "You do not have permission") {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (
        error.message === "Library not found" ||
        error.message === "User not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to add library member",
    });
  }
};

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
    if (error instanceof Error && error.message === "Library not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    console.error("Get library books error:", error);

    return res.status(500).json({
      message: "Failed to get library books",
    });
  }
};

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

    const book = await addBookToLibraryService(userId, libraryId, req.body);

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
