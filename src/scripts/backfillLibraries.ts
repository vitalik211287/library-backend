import prisma from "../utils/prisma.js";

const backfillLibraries = async () => {
  const users = await prisma.user.findMany({
    include: {
      libraryMemberships: true,
    },
  });

  console.log(`Users found: ${users.length}`);

  for (const user of users) {
    if (user.libraryMemberships.length > 0) {
      console.log(`Skip ${user.email}: already has a library`);

      continue;
    }

    const library = await prisma.library.create({
      data: {
        name: "Домашня бібліотека",

        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    console.log(`Created library "${library.name}" for ${user.email}`);
  }

  console.log("Library backfill completed");
};

backfillLibraries()
  .catch((error) => {
    console.error("Library backfill failed:", error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
