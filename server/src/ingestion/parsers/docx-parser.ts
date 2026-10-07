import mammoth from "mammoth";

import type { DocumentParser } from "./parser";
import type { ParsedDocument } from "./types";
import { HtmlParser } from "./html-parser";

export class DocxParser implements DocumentParser {
  private readonly htmlParser = new HtmlParser();

  async parse(
    input: Buffer,
    filename: string,
  ): Promise<ParsedDocument> {
    if (!input.length) {
      throw new Error("Document is empty");
    }

    const result = await mammoth.convertToHtml({
      buffer: input,
    });

    if (!result.value.trim()) {
      throw new Error(
        "DOCX did not contain extractable text",
      );
    }

    return this.htmlParser.parse(
      Buffer.from(result.value, "utf-8"),
      filename,
    );
  }
}