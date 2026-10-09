import iconv from "iconv-lite";

export const decodeFb2 = (buffer: Buffer): string => {
  const header = buffer.subarray(0, 512).toString("ascii");

  const declaredEncoding = header.match(
    /<\?xml[^>]*encoding=["']([^"']+)["']/i,
  )?.[1];

  const encoding = (declaredEncoding ?? "utf-8")
    .trim()
    .toLowerCase();

  if (!iconv.encodingExists(encoding)) {
    throw new Error("Unsupported FB2 encoding");
  }

  if (encoding === "utf-8" || encoding === "utf8") {
    return new TextDecoder("utf-8", {
      fatal: true,
    }).decode(buffer);
  }

  return iconv.decode(buffer, encoding);
};
