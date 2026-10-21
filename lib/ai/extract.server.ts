/**
 * Turns an uploaded resume file into plain text for the model.
 *
 * Text is extracted here rather than handing the PDF itself to the model: it
 * works with any model OpenRouter routes to, costs a fraction of the tokens,
 * and means nothing but text ever leaves this server.
 */

import { extractLinks, extractText, getDocumentProxy } from "unpdf";
import { AiError } from "./openrouter.server";
import { MAX_UPLOAD_BYTES } from "./limits";

const isPdf = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

const isText = (file: File) =>
  file.type.startsWith("text/") || /\.(txt|md|markdown)$/i.test(file.name);

export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AiError(
      `That file is over ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Try exporting a smaller PDF.`,
      413,
    );
  }
  if (isPdf(file)) return extractPdf(file);
  if (isText(file)) return file.text();
  throw new AiError("Upload a PDF or a plain-text (.txt, .md) file.", 415);
}

async function extractPdf(file: File): Promise<string> {
  let text: string;
  let links: string[];
  try {
    const pdf = await getDocumentProxy(
      new Uint8Array(await file.arrayBuffer()),
    );
    [{ text }, { links }] = await Promise.all([
      extractText(pdf, { mergePages: true }),
      extractLinks(pdf),
    ]);
  } catch {
    throw new AiError(
      "That PDF couldn't be read. It may be damaged or password-protected.",
      422,
    );
  }

  // A scanned resume is a picture of text; there is nothing to extract.
  if (text.replace(/\s/g, "").length < 50) {
    throw new AiError(
      "This PDF has no selectable text — it is probably a scan. Paste the text instead.",
      422,
    );
  }

  // A designed PDF often shows "LinkedIn" and hides the address in the
  // hyperlink, so pass the targets along or the model never sees them.
  const targets = [...new Set(links)].filter((l) =>
    /^(https?|mailto):/i.test(l),
  );
  return targets.length
    ? `${text}\n\nHyperlinks in the file:\n${targets.join("\n")}`
    : text;
}
