type BookMetadataInput = {
  title?: string | null;
  author?: string | null;
  genre?: string | null;
  description?: string | null;
};

type TagRule = {
  tag: string;
  keywords: string[];
};

const TAG_RULES: TagRule[] = [
  {
    tag: "science-fiction",
    keywords: [
      // EN
      "science fiction",
      "science-fiction",
      "sci-fi",
      "sci fi",

      // UA
      "наукова фантастика",
      "науково-фантастична",
      "науково фантастична",
      "фантастика",

      // RU
      "научная фантастика",
      "научно-фантастическая",
      "научно фантастическая",
      "фантастическая литература",
    ],
  },

  {
    tag: "fantasy",
    keywords: [
      // EN
      "fantasy",

      // UA
      "фентезі",
      "фетезі",

      // RU
      "фэнтези",
    ],
  },

  {
    tag: "detective",
    keywords: [
      // EN
      "detective",

      // UA / RU
      "детектив",
      "детективи",
      "детективы",
    ],
  },

  {
    tag: "thriller",
    keywords: [
      // EN
      "thriller",

      // UA
      "трилер",
      "трилери",

      // RU
      "триллер",
      "триллеры",
    ],
  },

  {
    tag: "history",
    keywords: [
      // EN
      "history",
      "historical",

      // UA
      "історія",
      "історичний",
      "історична",
      "історичні",

      // RU
      "история",
      "исторический",
      "историческая",
      "исторические",
    ],
  },

  {
    tag: "biography",
    keywords: [
      // EN
      "biography",
      "biographical",
      "memoir",

      // UA
      "біографія",
      "автобіографія",
      "мемуари",

      // RU
      "биография",
      "автобиография",
      "мемуары",
    ],
  },

  {
    tag: "psychology",
    keywords: [
      // EN
      "psychology",

      // UA
      "психологія",
      "психологічний",
      "психологічна",

      // RU
      "психология",
      "психологический",
      "психологическая",
    ],
  },

  {
    tag: "popular-science",
    keywords: [
      // EN
      "popular science",

      // UA
      "науково-популярний",
      "науково-популярна",
      "науково популярний",
      "науково популярна",

      // RU
      "научно-популярный",
      "научно-популярная",
      "научно популярный",
      "научно популярная",
    ],
  },

  {
    tag: "educational",
    keywords: [
      // EN
      "textbook",
      "educational",

      // UA
      "підручник",
      "посібник",
      "навчальний",
      "навчальна",
      "навчальна література",
      "учбовий",
      "учбова",

      // RU
      "учебник",
      "учебное пособие",
      "учебная литература",
      "учебный",
      "учебная",
    ],
  },

  {
    tag: "children",
    keywords: [
      // EN
      "children",
      "kids",

      // UA
      "дитяча",
      "дитячі",
      "для дітей",
      "казка",
      "казки",

      // RU
      "детская",
      "детские",
      "для детей",
      "сказка",
      "сказки",
    ],
  },

  {
    tag: "adventure",
    keywords: [
      // EN
      "adventure",
      "adventures",

      // UA
      "пригода",
      "пригоди",
      "пригодницький",
      "пригодницька",

      // RU
      "приключение",
      "приключения",
      "приключенческий",
      "приключенческая",
    ],
  },

  {
    tag: "space",
    keywords: [
      // EN
      "space",
      "spaceship",
      "planet",
      "galaxy",

      // UA
      "космос",
      "космічний",
      "космічна",
      "космічному",
      "планета",
      "галактика",

      // RU
      "космический",
      "космическая",
      "космическом",
      "планета",
      "галактика",
    ],
  },

  {
    tag: "humor",
    keywords: [
      // EN
      "humor",
      "humour",
      "comedy",

      // UA
      "гумор",
      "комедія",
      "смішний",
      "гумористичний",

      // RU
      "юмор",
      "комедия",
      "смешной",
      "юмористический",
    ],
  },

  {
    tag: "cooking",
    keywords: [
      // EN
      "cooking",
      "cookbook",
      "recipe",
      "recipes",

      // UA
      "кулінарія",
      "кулінарний",
      "рецепт",
      "рецепти",

      // RU
      "кулинария",
      "кулинарный",
      "рецепт",
      "рецепты",
    ],
  },

  {
    tag: "philosophy",
    keywords: [
      // EN
      "philosophy",

      // UA
      "філософія",
      "філософський",
      "філософська",

      // RU
      "философия",
      "философский",
      "философская",
    ],
  },
];

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[.,;:/\\|_()[\]{}"'«»“”!?—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const classifyBookMetadata = (book: BookMetadataInput): string[] => {
  const searchableText = normalizeText(
    [book.title, book.author, book.genre, book.description]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  );

  if (!searchableText) {
    return [];
  }

  return TAG_RULES.filter(({ keywords }) =>
    keywords.some((keyword) => searchableText.includes(normalizeText(keyword))),
  ).map(({ tag }) => tag);
};
