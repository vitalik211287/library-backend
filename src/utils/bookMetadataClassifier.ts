type BookMetadataInput = {
  title?: string | null;
  author?: string | null;
  genre?: string | null;
  description?: string | null;
};

type GenreRule = {
  tags: string[];
  keywords: string[];
};

const GENRE_RULES: GenreRule[] = [
  {
    tags: ["science-fiction"],
    keywords: [
      "science fiction",
      "science-fiction",
      "sci-fi",
      "sci fi",
      "наукова фантастика",
      "науково-фантастична",
      "науково фантастична",
      "научная фантастика",
      "научно-фантастическая",
      "научно фантастическая",
      "фантастика про космос",
    ],
  },

  {
    tags: ["children", "fantasy"],
    keywords: [
      "дитяча фантастика",
      "дитяче фентезі",
      "дитячий фентезі",
      "підліткове фентезі",
      "детская фантастика",
      "детское фэнтези",
      "подростковое фэнтези",
      "children fantasy",
      "children's fantasy",
      "young adult fantasy",
    ],
  },

  {
    tags: ["fantasy"],
    keywords: ["фентезі", "фетезі", "фэнтези", "fantasy"],
  },

  {
    tags: ["children", "detective"],
    keywords: [
      "дитячий детектив",
      "дитячі детективи",
      "детский детектив",
      "детские детективы",
      "children detective",
    ],
  },

  {
    tags: ["detective"],
    keywords: [
      "детектив",
      "детективи",
      "детективы",
      "detective",
      "crime fiction",
    ],
  },

  {
    tags: ["thriller"],
    keywords: [
      "трилер",
      "трилери",
      "триллер",
      "триллеры",
      "thriller",
      "thrillers",
    ],
  },

  {
    tags: ["history"],
    keywords: [
      "історичний роман",
      "історичні романи",
      "історична проза",
      "исторический роман",
      "исторические романы",
      "historical fiction",
      "historical novel",
    ],
  },

  {
    tags: ["biography"],
    keywords: [
      "біографія",
      "біографії",
      "автобіографія",
      "мемуари",
      "биография",
      "биографии",
      "автобиография",
      "мемуары",
      "biography",
      "autobiography",
      "memoir",
      "memoirs",
    ],
  },

  {
    tags: ["psychology"],
    keywords: [
      "психологія",
      "психологічна література",
      "психология",
      "психологическая литература",
      "psychology",
    ],
  },

  {
    tags: ["popular-science"],
    keywords: [
      "науково-популярна",
      "науково-популярний",
      "науково популярна",
      "науково популярний",
      "научно-популярная",
      "научно-популярный",
      "научно популярная",
      "научно популярный",
      "popular science",
    ],
  },

  {
    tags: ["educational"],
    keywords: [
      "навчальна література",
      "навчальний",
      "навчальна",
      "учбова",
      "учбовий",
      "підручник",
      "посібник",
      "учебная литература",
      "учебный",
      "учебная",
      "учебник",
      "учебное пособие",
      "textbook",
      "educational",
    ],
  },

  {
    tags: ["children"],
    keywords: [
      "дитяча література",
      "дитяча проза",
      "дитячі енциклопедії",
      "дитячий",
      "дитяча",
      "казки",
      "казка",
      "детская литература",
      "детская проза",
      "детские энциклопедии",
      "детский",
      "детская",
      "сказки",
      "сказка",
      "children",
      "children's literature",
      "kids",
    ],
  },

  {
    tags: ["adventure"],
    keywords: [
      "пригоди",
      "пригодницька література",
      "пригодницький роман",
      "приключения",
      "приключенческая литература",
      "приключенческий роман",
      "adventure",
      "adventures",
    ],
  },

  {
    tags: ["cooking"],
    keywords: [
      "кулінарія",
      "кулінарна література",
      "кулинария",
      "кулинарная литература",
      "cooking",
      "cookbook",
    ],
  },

  {
    tags: ["philosophy"],
    keywords: [
      "філософія",
      "філософська література",
      "философия",
      "философская литература",
      "philosophy",
    ],
  },

  {
    tags: ["humor"],
    keywords: [
      "гумор",
      "гумористична література",
      "юмор",
      "юмористическая литература",
      "humor",
      "humour",
      "comedy",
    ],
  },

  {
    tags: ["space"],
    keywords: [
      "космічна фантастика",
      "фантастика про космос",
      "космическая фантастика",
      "space fiction",
      "space opera",
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
  const genre = normalizeText(book.genre ?? "");

  if (!genre) {
    return [];
  }

  const tags = new Set<string>();

  for (const rule of GENRE_RULES) {
    const matched = rule.keywords.some((keyword) =>
      genre.includes(normalizeText(keyword)),
    );

    if (matched) {
      rule.tags.forEach((tag) => tags.add(tag));
    }
  }

  return Array.from(tags).sort();
};
