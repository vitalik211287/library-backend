import { recordUserEbookHeartbeat } from "../repositories/userReadingRepository.js";

export const heartbeatUserReadingService = async (
  userId: string,
  bookId: string,
  sessionId: string,
  readerLeaseId: string,
) => {
  return recordUserEbookHeartbeat(
    userId,
    bookId,
    sessionId,
    readerLeaseId,
  );
};
