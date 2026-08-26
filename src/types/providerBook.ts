export type ProviderBook = {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  pages: number | null;
  language: string | null;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
  sourceUrl: string;
};

export type BookProvider = {
  name: string;
  getBook: (isbn: string) => Promise<ProviderBook>;
};