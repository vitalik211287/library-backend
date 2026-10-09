import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { detectEbookFormat } from "../utils/detectEbookFormat.js";

test("detects valid PDF document", async () => {
  const { readFileSync } = await import("node:fs");
  const buffer = readFileSync(
    new URL("./fixtures/valid.pdf", import.meta.url),
  );

  assert.equal(
    await detectEbookFormat(buffer, "valid.pdf"),
    "PDF",
  );
});

test("detects FB2 by root element", async () => {
  const buffer = Buffer.from(
    '<?xml version="1.0" encoding="utf-8"?><FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0"></FictionBook>',
  );

  assert.equal(
    await detectEbookFormat(buffer, "book.fb2"),
    "FB2",
  );
});

test("rejects PDF with incorrect signature", async () => {
  await assert.rejects(
    detectEbookFormat(Buffer.from("not a pdf"), "book.pdf"),
    /Invalid or unsupported ebook format/,
  );
});

test("rejects FB2 without FictionBook root", async () => {
  await assert.rejects(
    detectEbookFormat(Buffer.from("<html></html>"), "book.fb2"),
    /Invalid or unsupported ebook format/,
  );
});

test("rejects corrupted EPUB archive", async () => {
  await assert.rejects(
    detectEbookFormat(Buffer.from("not a zip archive"), "book.epub"),
    /Invalid or unsupported ebook format/,
  );
});

test("rejects unsupported extensions", async () => {
  await assert.rejects(
    detectEbookFormat(Buffer.from("test"), "book.exe"),
    /Invalid or unsupported ebook format/,
  );
});

test("detects valid EPUB archive", async () => {
  const buffer = readFileSync(new URL("./fixtures/test-book.epub", import.meta.url));

  assert.equal(
    await detectEbookFormat(buffer, "test-book.epub"),
    "EPUB",
  );
});

for (const name of [
  "missing-container.epub",
  "invalid-mimetype.epub",
  "missing-opf.epub",
]) {
  test(`rejects invalid EPUB: ${name}`, async () => {
    const buffer = readFileSync(
      new URL(`./fixtures/${name}`, import.meta.url),
    );

    await assert.rejects(
      detectEbookFormat(buffer, name),
      /Invalid or unsupported ebook format/,
    );
  });
}
test("rejects EPUB with invalid XML structure", async () => {
  const buffer = readFileSync(
    new URL("./fixtures/invalid-xml.epub", import.meta.url),
  );

  await assert.rejects(
    detectEbookFormat(buffer, "invalid-xml.epub"),
    /Invalid or unsupported ebook format/,
  );
});

for (const name of [
  "duplicate-entry.epub",
  "path-traversal.epub",
  "absolute-path.epub",
]) {
  test(`rejects unsafe EPUB: ${name}`, async () => {
    const buffer = readFileSync(
      new URL(`./fixtures/${name}`, import.meta.url),
    );

    await assert.rejects(
      detectEbookFormat(buffer, name),
      /Invalid or unsupported ebook format/,
    );
  });
}

for (const name of [
  "too-many-entries.epub",
  "oversized-uncompressed.epub",
]) {
  test(`rejects EPUB exceeding ZIP limits: ${name}`, async () => {
    const buffer = readFileSync(
      new URL(`./fixtures/${name}`, import.meta.url),
    );

    await assert.rejects(
      detectEbookFormat(buffer, name),
      /Invalid or unsupported ebook format/,
    );
  });
}

test("rejects malformed FB2 XML", async () => {
  const buffer = Buffer.from(
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">' +
    '<description><title-info></description></FictionBook>',
  );

  await assert.rejects(
    detectEbookFormat(buffer, "malformed.fb2"),
    /Invalid or unsupported ebook format/,
  );
});

test("detects FB2 encoded in Windows-1251", async () => {
  const iconv = await import("iconv-lite");

  const xml = `<?xml version="1.0" encoding="windows-1251"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
  <description>
    <title-info>
      <book-title>Тестова книга</book-title>
    </title-info>
  </description>
</FictionBook>`;

  const buffer = iconv.default.encode(xml, "windows-1251");

  assert.equal(
    await detectEbookFormat(buffer, "test.fb2"),
    "FB2",
  );
});

test("preserves Cyrillic text when decoding Windows-1251 FB2", async () => {
  const iconv = (await import("iconv-lite")).default;
  const { decodeFb2 } = await import("../utils/decodeFb2.js");

  const original = `<?xml version="1.0" encoding="windows-1251"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
  <description>
    <title-info>
      <book-title>Тестова книга</book-title>
    </title-info>
  </description>
</FictionBook>`;

  const buffer = iconv.encode(original, "windows-1251");
  const decoded = decodeFb2(buffer);

  assert.equal(decoded, original);
  assert.ok(decoded.includes("Тестова книга"));
});

test("rejects FB2 with unsupported encoding", async () => {
  const xml = `<?xml version="1.0" encoding="unknown-encoding"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
</FictionBook>`;

  await assert.rejects(
    detectEbookFormat(Buffer.from(xml), "invalid.fb2"),
    /Invalid or unsupported ebook format/,
  );
});

test("rejects FB2 with invalid UTF-8", async () => {
  const prefix = Buffer.from(
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">' +
    '<description>',
  );

  const invalidBytes = Buffer.from([0xC3, 0x28]);

  const suffix = Buffer.from(
    '</description></FictionBook>',
  );

  await assert.rejects(
    detectEbookFormat(
      Buffer.concat([prefix, invalidBytes, suffix]),
      "invalid-utf8.fb2",
    ),
    /Invalid or unsupported ebook format/,
  );
});

test("rejects truncated PDF with valid signature", async () => {
  const buffer = Buffer.from("%PDF-1.7\nThis is not a PDF");

  await assert.rejects(
    detectEbookFormat(buffer, "broken.pdf"),
    /Invalid or unsupported ebook format/,
  );
});
