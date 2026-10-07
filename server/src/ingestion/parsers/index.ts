import path from "node:path";

import type { DocumentParser } from "./parser";
import { MarkdownParser } from "./markdown-parser";
import { HtmlParser } from "./html-parser";
import { DocxParser } from "./docx-parser";
import { PdfParser } from "./pdf-parser";

const parsers: Record<
  string,
  () => DocumentParser
> = {
  ".md": () => new MarkdownParser(),
  ".markdown": () => new MarkdownParser(),

  ".html": () => new HtmlParser(),
  ".htm": () => new HtmlParser(),

  ".docx": () => new DocxParser(),

  ".pdf": () => new PdfParser(),
};

export function getParser(
  filename: string,
): DocumentParser {
  const extension = path
    .extname(filename)
    .toLowerCase();

  const factory = parsers[extension];

  if (!factory) {
    throw new Error(
      `Unsupported document extension: ${extension}`,
    );
  }

  return factory();
}