import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const validatePdf = async (
  buffer: Buffer,
): Promise<boolean> => {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return false;
  }

  const task = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    disableFontFace: true,
  });

  try {
    const pdf = await task.promise;
    return pdf.numPages > 0;
  } catch {
    return false;
  } finally {
    await task.destroy();
  }
};
