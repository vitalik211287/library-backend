import yauzl from "yauzl";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { decodeFb2 } from "./decodeFb2.js";
import { validatePdf } from "./validatePdf.js";

export type EbookFormat = "EPUB" | "FB2" | "PDF";

const MAX_ZIP_ENTRIES = 3000;
const MAX_UNCOMPRESSED_SIZE = 200 * 1024 * 1024;
const MAX_XML_SIZE = 1024 * 1024;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: false,
});

const parseXml = (xml: string): any | null => {
  if (XMLValidator.validate(xml) !== true) return null;

  try {
    return xmlParser.parse(xml);
  } catch {
    return null;
  }
};

const readEntry = (
  zip: yauzl.ZipFile,
  entry: yauzl.Entry,
  limit: number,
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (entry.uncompressedSize > limit) {
      reject(new Error("ZIP entry exceeds size limit"));
      return;
    }

    zip.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error ?? new Error("Cannot read ZIP entry"));
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;

      stream.on("data", (chunk: Buffer) => {
        size += chunk.length;

        if (size > limit) {
          stream.destroy(new Error("ZIP entry exceeds size limit"));
          return;
        }

        chunks.push(chunk);
      });

      stream.on("error", reject);

      stream.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8"));
      });
    });
  });

const detectEpub = (buffer: Buffer): Promise<boolean> =>
  new Promise((resolve) => {
    yauzl.fromBuffer(
      buffer,
      {
        lazyEntries: true,
        validateEntrySizes: true,
        autoClose: true,
      },
      (error, zip) => {
        if (error || !zip) {
          resolve(false);
          return;
        }

        let settled = false;
        let entries = 0;
        let totalSize = 0;
        let validMime = false;
        let containerXml: string | null = null;

        const opfFiles = new Map<string, string>();
        const seenPaths = new Set<string>();

        const finish = (valid: boolean) => {
          if (settled) return;
          settled = true;
          zip.close();
          resolve(valid);
        };

        zip.on("error", () => finish(false));

        zip.on("end", () => {
          if (!validMime || !containerXml) {
            finish(false);
            return;
          }

          const container = parseXml(containerXml);
          const rootfiles = container?.container?.rootfiles?.rootfile;

          const rootfile = Array.isArray(rootfiles)
            ? rootfiles[0]
            : rootfiles;

          const opfPath = rootfile?.["@_full-path"];
          const mediaType = rootfile?.["@_media-type"];

          if (
            typeof opfPath !== "string" ||
            mediaType !== "application/oebps-package+xml"
          ) {
            finish(false);
            return;
          }

          const opf = opfFiles.get(opfPath);

          if (!opf) {
            finish(false);
            return;
          }

          const parsedOpf = parseXml(opf);
          const packageData = parsedOpf?.package;

          finish(
            !!packageData &&
            packageData["@_xmlns"] ===
              "http://www.idpf.org/2007/opf",
          );
        });

        zip.on("entry", async (entry) => {
          if (settled) return;

          entries++;
          totalSize += entry.uncompressedSize;

          if (
            entries > MAX_ZIP_ENTRIES ||
            totalSize > MAX_UNCOMPRESSED_SIZE
          ) {
            finish(false);
            return;
          }

          const name = entry.fileName;
          const normalizedName = name.replace(/\\/g, "/");

          const parts = normalizedName.split("/");

          if (
            normalizedName.startsWith("/") ||
            normalizedName.includes("\0") ||
            /^[A-Za-z]:/.test(normalizedName) ||
            parts.includes("..") ||
            parts.includes(".") ||
            seenPaths.has(normalizedName)
          ) {
            finish(false);
            return;
          }

          seenPaths.add(normalizedName);

          try {
            if (entries === 1) {
              if (
                name !== "mimetype" ||
                entry.compressionMethod !== 0
              ) {
                finish(false);
                return;
              }

              const mime = await readEntry(zip, entry, 128);

              validMime = mime === "application/epub+zip";

              if (!validMime) {
                finish(false);
                return;
              }
            } else if (name === "META-INF/container.xml") {
              containerXml = await readEntry(
                zip,
                entry,
                MAX_XML_SIZE,
              );
            } else if (name.toLowerCase().endsWith(".opf")) {
              opfFiles.set(
                name,
                await readEntry(zip, entry, MAX_XML_SIZE),
              );
            }

            if (!settled) zip.readEntry();
          } catch {
            finish(false);
          }
        });

        zip.readEntry();
      },
    );
  });

export const detectEbookFormat = async (
  buffer: Buffer,
  fileName: string,
): Promise<EbookFormat> => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf" && await validatePdf(buffer)) {
    return "PDF";
  }

  if (extension === "epub" && await detectEpub(buffer)) {
    return "EPUB";
  }

  if (extension === "fb2") {
    try {
      const xml = decodeFb2(buffer);
      const parsed = parseXml(xml);

      if (
        parsed?.FictionBook &&
        parsed.FictionBook["@_xmlns"] ===
          "http://www.gribuser.ru/xml/fictionbook/2.0"
      ) {
        return "FB2";
      }
    } catch {
      // Invalid encoding or malformed FB2.
    }
  }

  throw new Error("Invalid or unsupported ebook format");
};
