import prisma from "../../../utils/prisma.js";

export const getUserReadingSessionsForPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date,
) => {
  return prisma.readingSession.findMany({
    where: {
      userId,

      startedAt: {
        gte: startDate,
        lt: endDate,
      },
    },

    include: {
      book: {
        select: {
          id: true,
          title: true,
          coverUrl: true,
        },
      },
    },

    orderBy: {
      startedAt: "asc",
    },
  });
};
