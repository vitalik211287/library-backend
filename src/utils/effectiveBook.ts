import type { Book, LibraryBook, UserBook } from "@prisma/client";

type LibraryBookOverrides = Pick<
  LibraryBook,
  | "title"
  | "author"
  | "publisher"
  | "year"
  | "pages"
  | "genre"
  | "language"
  | "coverUrl"
  | "description"
>;

type UserBookState = Pick<
  UserBook,
  | "id"
  | "currentPage"
  | "currentPercent"
  | "progressMode"
  | "status"
  | "rating"
  | "isWishlist"
  | "finishedAt"
>;

type BuildEffectiveBookParams = {
  book: Book;
  libraryBook?: LibraryBookOverrides | null;
  userBook?: UserBookState | null;
};

export const buildEffectiveBook = ({
  book,
  libraryBook = null,
  userBook = null,
}: BuildEffectiveBookParams) => {
  return {
    ...book,

    title: libraryBook?.title ?? book.title,

    author: libraryBook?.author ?? book.author,

    publisher: libraryBook?.publisher ?? book.publisher,

    year: libraryBook?.year ?? book.year,

    pages: libraryBook?.pages ?? book.pages,

    genre: libraryBook?.genre ?? book.genre,

    language: libraryBook?.language ?? book.language,

    coverUrl: libraryBook?.coverUrl ?? book.coverUrl,

    description: libraryBook?.description ?? book.description,

    userBookId: userBook?.id ?? null,

    currentPage: userBook?.currentPage ?? 0,

    currentPercent: userBook?.currentPercent ?? 0,

    progressMode: userBook?.progressMode ?? "PAGES",

    status: userBook?.status ?? "NOT_STARTED",

    rating: userBook?.rating ?? null,

    isWishlist: userBook?.isWishlist ?? false,

    finishedAt: userBook?.finishedAt ?? null,
  };
};
