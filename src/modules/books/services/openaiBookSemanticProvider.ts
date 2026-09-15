import OpenAI from "openai";

import {
  ALLOWED_SEMANTIC_TAGS,
  sanitizeSemanticBookTags,
  type SemanticBookTag,
} from "../../../utils/bookSemanticTags.js";

export type SemanticClassificationInput = {
  title?: string | null | undefined;
  author?: string | null | undefined;
  genre?: string | null | undefined;
  description?: string | null | undefined;
};

const getOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
};

export const classifyBookSemanticTags = async (
  book: SemanticClassificationInput,
): Promise<SemanticBookTag[]> => {
  const client = getOpenAIClient();

  if (!client) {
    return [];
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You classify books for a personal library recommendation system. " +
            "Choose only the most distinctive and useful semantic tags for recommending this specific book. " +
            "Use only tags from the provided allowedTags list. " +
            "Return 3 to 7 tags maximum. " +
            "Do not select a tag merely because it could broadly apply to the book. " +
            "Prefer specific themes, setting, mood, plot elements, and reading experience that distinguish the book from others. " +
            "Avoid redundant or weakly supported tags. " +
            "If the metadata supports fewer than 3 tags, return fewer. " +
            "If the metadata is insufficient for reliable classification, return []. " +
            "Return only a valid JSON array of tag strings with no explanation.",
        },
        {
          role: "user",
          content: JSON.stringify({
            book: {
              title: book.title ?? null,
              author: book.author ?? null,
              genre: book.genre ?? null,
              description: book.description ?? null,
            },
            allowedTags: ALLOWED_SEMANTIC_TAGS,
          }),
        },
      ],
    });

    const text = response.output_text?.trim();

    if (!text) {
      return [];
    }

    const parsed: unknown = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sanitizeSemanticBookTags(
      parsed.filter((value): value is string => typeof value === "string"),
    );
  } catch (error) {
    console.error("Book semantic classification failed:", error);

    // AI must never prevent a book from being added.
    return [];
  }
};
