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
      "science fiction",
      "science-fiction",
      "sci-fi",
      "sci fi",
      "наукова фантастика",
      "фантастика",
    ],
  },
  {
    tag: "fantasy",
    keywords: ["fantasy", "фентезі", "фетезі"],
  },
  {
    tag: "detective",
    keywords: ["detective", "детектив"],
  },
  {
    tag: "thriller",
    keywords: ["thriller", "трилер"],
  },
  {
    tag: "history",
    keywords: ["history", "historical", "історія", "історичний", "історична"],
  },
  {
    tag: "biography",
    keywords: [
      "biography",
      "biographical",
      "memoir",
      "біографія",
      "автобіографія",
      "мемуари",
    ],
  },
  {
    tag: "psychology",
    keywords: ["psychology", "психологія", "психологічний", "психологічна"],
  },
  {
    tag: "popular-science",
    keywords: [
      "popular science",
      "науково-популярний",
      "науково-популярна",
      "науково популярний",
      "науково популярна",
    ],
  },
  {
    tag: "educational",
    keywords: [
      "textbook",
      "підручник",
      "посібник",
      "навчальний",
      "навчальна",
      "учбовий",
      "учбова",
    ],
  },
  {
    tag: "children",
    keywords: ["children", "kids", "дитяча", "для дітей", "казка", "казки"],
  },
  {
    tag: "adventure",
    keywords: [
      "adventure",
      "adventures",
      "пригода",
      "пригоди",
      "пригодницький",
      "пригодницька",
    ],
  },
  {
    tag: "space",
    keywords: [
      "space",
      "spaceship",
      "planet",
      "galaxy",
      "космос",
      "космічний",
      "космічна",
      "космічному",
      "космічний",
      "планета",
      "галактика",
    ],
  },
  {
    tag: "humor",
    keywords: ["humor", "humour", "comedy", "гумор", "комедія", "смішний"],
  },
  {
    tag: "cooking",
    keywords: [
      "cooking",
      "cookbook",
      "recipe",
      "recipes",
      "кулінарія",
      "рецепт",
      "рецепти",
    ],
  },
  {
    tag: "philosophy",
    keywords: ["philosophy", "філософія", "філософський", "філософська"],
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
