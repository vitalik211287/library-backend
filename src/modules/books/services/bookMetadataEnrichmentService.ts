import {
  mergeBookTags,
  type SemanticBookTag,
} from "../../../utils/bookSemanticTags.js";

import { classifyBookSemanticTags } from "./openaiBookSemanticProvider.js";

export type BookEnrichmentInput = {
  title?: string | null | undefined;
  author?: string | null | undefined;
  genre?: string | null | undefined;
  description?: string | null | undefined;
  tags?: readonly string[];
};

export type BookEnrichmentResult = {
  semanticTags: SemanticBookTag[];
  tags: string[];
};

export const enrichBookMetadata = async (
  input: BookEnrichmentInput,
): Promise<BookEnrichmentResult> => {
  const currentTags = input.tags ?? [];

  const semanticTags = await classifyBookSemanticTags({
    title: input.title,
    author: input.author,
    genre: input.genre,
    description: input.description,
  });

  const tags = mergeBookTags(currentTags, semanticTags);

  return {
    semanticTags,
    tags,
  };
};
