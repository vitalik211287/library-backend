import prisma from "../utils/prisma.js";

const inspectLibraryBooks = async () => {
  const users = await prisma.user.findMany({
    include: {
      libraryMemberships: {
        include: {
          library: true,
        },
      },
      books: {
        include: {
          book: true,
        },
      },
    },
  });

  console.log(`Users found: ${users.length}`);
  console.log("");

  for (const user of users) {
    console.log("====================================");
    console.log(`User: ${user.email}`);

    if (user.libraryMemberships.length === 0) {
      console.log("Library: none");
    } else {
      for (const membership of user.libraryMemberships) {
        console.log(`Library: ${membership.library.name} (${membership.role})`);
      }
    }

    console.log(`UserBooks: ${user.books.length}`);

    if (user.books.length === 0) {
      console.log("No UserBook records");
      console.log("");

      continue;
    }

    for (const userBook of user.books) {
      const libraryBook = await prisma.libraryBook.findFirst({
        where: {
          bookId: userBook.bookId,
          library: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      });

      const status = libraryBook ? "already in library" : "NOT in library";

      console.log(
        `- ${userBook.book.title} | ${userBook.book.isbn} | ${status}`,
      );
    }

    console.log("");
  }
};

inspectLibraryBooks()
  .catch((error) => {
    console.error("Inspect library books failed:", error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
