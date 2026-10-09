import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { r2Client, r2BucketName } from "../config/r2.js";

type UploadBookFileParams = {
  libraryBookId: string;
  buffer: Buffer;
  mimeType: string;
};

export const uploadBookFile = async ({
  libraryBookId,
  buffer,
  mimeType,
}: UploadBookFileParams): Promise<string> => {
  const storageKey = `ebooks/${libraryBookId}/${randomUUID()}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  return storageKey;
};

export const getBookFile = async (
  storageKey: string,
): Promise<Readable> => {
  const result = await r2Client.send(
    new GetObjectCommand({
      Bucket: r2BucketName,
      Key: storageKey,
    }),
  );

  if (!result.Body) {
    throw new Error("Book file is empty");
  }

  return result.Body as Readable;
};

export const deleteBookFile = async (
  storageKey: string,
): Promise<void> => {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: storageKey,
    }),
  );
};
