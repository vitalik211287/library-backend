export const ALLOWED_SEMANTIC_TAGS = [
  // Atmosphere
  "dark",
  "cozy",
  "humorous",
  "satirical",
  "emotional",

  // Plot
  "adventure",
  "mystery",
  "survival",
  "quest",
  "investigation",

  // Themes
  "space",
  "politics",
  "war",
  "technology",
  "science",
  "society",

  // World / setting
  "supernatural",
  "magic",
  "monsters",
  "aliens",
  "post-apocalyptic",

  // Ideas
  "philosophical",
  "psychological",
  "social-commentary",

  // Scale
  "epic",
  "personal-story",

  // Reading style
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
 * Перевіряє, чи є значення дозволеним semantic tag.
 */
export const isSemanticBookTag = (value: string): value is SemanticBookTag => {
  return ALLOWED_SEMANTIC_TAG_SET.has(value);
};

/**
 * Приймає потенційні semantic tags та залишає тільки
 * значення з нашого контрольованого словника.
 *
 * Також:
 * - прибирає дублікати;
 * - приводить значення до lower-case;
 * - обрізає пробіли.
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
 * Об'єднує вже існуючі Book.tags із semantic tags,
 * не видаляючи genre tags та не створюючи дублікатів.
 */
export const mergeBookTags = (
  currentTags: readonly string[],
  semanticTags: readonly string[],
): string[] => {
  const validSemanticTags = sanitizeSemanticBookTags(semanticTags);

  return [...new Set([...currentTags, ...validSemanticTags])];
};
