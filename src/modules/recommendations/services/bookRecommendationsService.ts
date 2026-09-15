import { getLibraryRecommendationCandidates } from "../../libraries/repositories/librariesRepository.js";
import {
  isSemanticBookTag,
  type SemanticBookTag,
} from "../../../utils/bookSemanticTags.js";

export type BookRecommendation = {
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  tags: string[];
  matchedTags: SemanticBookTag[];
  score: number;
};

export const getBookRecommendationsService = async (
  userId: string,
  libraryId: string,
  requestedTags: readonly string[],
  limit = 10,
): Promise<BookRecommendation[]> => {
  const selectedTags = [
    ...new Set(
      requestedTags
        .map((tag) => tag.trim().toLowerCase())
        .filter(isSemanticBookTag),
    ),
  ];

  if (selectedTags.length === 0) {
    return [];
  }

  const candidates = await getLibraryRecommendationCandidates(
    libraryId,
    userId,
  );

  const recommendations = candidates
    .map((libraryBook) => {
      const effectiveTags = libraryBook.book.tags ?? [];

      const matchedTags = selectedTags.filter((tag) =>
        effectiveTags.includes(tag),
      );

      const score = matchedTags.length / selectedTags.length;

      return {
        bookId: libraryBook.book.id,
        title: libraryBook.book.title,
        author: libraryBook.book.author,
        coverUrl: libraryBook.coverUrl ?? libraryBook.book.coverUrl,
        tags: effectiveTags,
        matchedTags,
        score,
      };
    })
    .filter((recommendation) => recommendation.matchedTags.length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.matchedTags.length - a.matchedTags.length;
    });

  const minimumStrongMatches = selectedTags.length === 1 ? 1 : 2;

  const strongRecommendations = recommendations.filter(
    (recommendation) =>
      recommendation.matchedTags.length >= minimumStrongMatches,
  );

  if (strongRecommendations.length >= limit) {
    return strongRecommendations.slice(0, limit);
  }

  const weakRecommendations = recommendations.filter(
    (recommendation) =>
      recommendation.matchedTags.length < minimumStrongMatches,
  );

  return [...strongRecommendations, ...weakRecommendations].slice(0, limit);
};
