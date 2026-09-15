export const ALLOWED_SEMANTIC_TAGS = [
  // Atmosphere / mood
  "dark",
  "cozy",
  "humorous",
  "satirical",
  "emotional",
  "hopeful",
  "tense",
  "romantic",

  // Plot / story
  "adventure",
  "mystery",
  "survival",
  "quest",
  "investigation",
  "time-travel",
  "coming-of-age",

  // Relationships
  "family",
  "friendship",
  "romance",

  // Themes
  "space",
  "politics",
  "war",
  "technology",
  "science",
  "society",
  "history",
  "nature",
  "religion",

  // World / setting
  "supernatural",
  "magic",
  "aliens",
  "post-apocalyptic",
  "dystopian",
  "historical",
  "mythology",

  // Ideas
  "philosophical",
  "psychological",
  "social-commentary",

  // Non-fiction / interests
  "cocktails",
  "mixology",
  "food",
  "art",
  "cinema",
  "programming",

  // Scale / structure
  "epic",
  "anthology",

  // Reading experience
  "fast-paced",
  "slow-paced",
  "light-read",
  "complex",
  "short",
  "long",
] as const;

export type SemanticBookTag = (typeof ALLOWED_SEMANTIC_TAGS)[number];

const ALLOWED_SEMANTIC_TAG_SET = new Set<string>(ALLOWED_SEMANTIC_TAGS);

/**
 * Перевіряє, чи є значення дозволеним семантичним тегом книги.
 */
export const isSemanticBookTag = (value: string): value is SemanticBookTag => {
  return ALLOWED_SEMANTIC_TAG_SET.has(value);
};

/**
 * Нормалізує потенційні семантичні теги та залишає лише
 * значення з контрольованого словника.
 *
 * Також:
 * - видаляє дублікати;
 * - переводить значення в lower-case;
 * - прибирає зайві пробіли.
 */
export const sanitizeSemanticBookTags = (
  values: readonly string[],
): SemanticBookTag[] => {
  const result = new Set<SemanticBookTag>();

  for (const value of values) {
    const normalized = String(value).trim().toLowerCase();

    if (isSemanticBookTag(normalized)) {
      result.add(normalized);
    }
  }

  return [...result];
};

/**
 * Об'єднує наявні Book.tags із семантичними тегами,
 * не видаляючи жанрові теги та не створюючи дублікатів.
 */
export const mergeBookTags = (
  currentTags: readonly string[],
  semanticTags: readonly string[],
): string[] => {
  const validSemanticTags = sanitizeSemanticBookTags(semanticTags);

  return [...new Set([...currentTags, ...validSemanticTags])];
};
