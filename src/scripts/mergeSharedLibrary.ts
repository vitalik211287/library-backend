import prisma from "../utils/prisma.js";

const SHARED_LIBRARY_NAME = "Домашня бібліотека";
const OWNER_EMAIL = "vitalik211287@gmail.com";

const mergeSharedLibrary = async () => {
  const users = await prisma.user.findMany({
    include: {
      libraryMemberships: {
        include: {
          library: true,
        },
      },
    },
  });

  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      isbn: true,
    },
  });

  if (users.length === 0) {
    throw new Error("No users found");
  }

  const owner = users.find((user) => user.email === OWNER_EMAIL);

  if (!owner) {
    throw new Error(`Library owner ${OWNER_EMAIL} not found`);
  }

  console.log(`Users found: ${users.length}`);
  console.log(`Books found: ${books.length}`);

  const result = await prisma.$transaction(
    async (tx) => {
      const existingLibraries = await tx.library.findMany({
        where: {
          name: SHARED_LIBRARY_NAME,
        },
        include: {
          members: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      let sharedLibrary = existingLibraries[0];

      if (!sharedLibrary) {
        sharedLibrary = await tx.library.create({
          data: {
            name: SHARED_LIBRARY_NAME,
          },
          include: {
            members: true,
          },
        });
      }

      console.log(`Using library: ${sharedLibrary.name} (${sharedLibrary.id})`);

      for (const user of users) {
        const role = user.email === OWNER_EMAIL ? "OWNER" : "MEMBER";

        await tx.libraryMember.upsert({
          where: {
            libraryId_userId: {
              libraryId: sharedLibrary.id,
              userId: user.id,
            },
          },
          update: {
            role,
          },
          create: {
            libraryId: sharedLibrary.id,
            userId: user.id,
            role,
          },
        });
      }

      await tx.libraryBook.createMany({
        data: books.map((book) => ({
          libraryId: sharedLibrary.id,
          bookId: book.id,
        })),
        skipDuplicates: true,
      });

      const duplicateLibraries = existingLibraries.filter(
        (library) => library.id !== sharedLibrary.id,
      );

      for (const duplicate of duplicateLibraries) {
        await tx.libraryMember.deleteMany({
          where: {
            libraryId: duplicate.id,
          },
        });

        await tx.libraryBook.deleteMany({
          where: {
            libraryId: duplicate.id,
          },
        });

        await tx.library.delete({
          where: {
            id: duplicate.id,
          },
        });
      }

      const membersCount = await tx.libraryMember.count({
        where: {
          libraryId: sharedLibrary.id,
        },
      });

      const booksCount = await tx.libraryBook.count({
        where: {
          libraryId: sharedLibrary.id,
        },
      });

      return {
        libraryId: sharedLibrary.id,
        membersCount,
        booksCount,
        deletedDuplicates: duplicateLibraries.length,
      };
    },
    {
      timeout: 20000,
    },
  );

  console.log("");
  console.log("Shared library merge completed");
  console.log(`Library ID: ${result.libraryId}`);
  console.log(`Members: ${result.membersCount}`);
  console.log(`Books: ${result.booksCount}`);
  console.log(`Deleted duplicate libraries: ${result.deletedDuplicates}`);
};

mergeSharedLibrary()
  .catch((error) => {
    console.error("Shared library merge failed:", error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
