import { PDFParse } from "pdf-parse";

import type { DocumentParser } from "./parser";
import type {
  ParsedDocument,
  ParsedSection,
  ParsedStep,
} from "./types";

export class PdfParser implements DocumentParser {
  async parse(
    input: Buffer,
    filename: string,
  ): Promise<ParsedDocument> {
    if (!input.length) {
      throw new Error("PDF is empty");
    }

    const parser = new PDFParse({
      data: input,
    });

    try {
      const result = await parser.getText();

      const text = result.text
        .replace(/\r/g, "")
        .trim();

      if (!text) {
        throw new Error(
          "PDF contains no extractable text. It may be scanned or image-only.",
        );
      }

      const lines = text.split("\n");

      const title =
        this.extractTitle(lines) ??
        this.filenameToTitle(filename);

      const sections: ParsedSection[] = [];

      let currentSection: ParsedSection | null =
        null;

      let currentStep: ParsedStep | null =
        null;

      for (const rawLine of lines) {
        const line = rawLine
          .replace(/\s+/g, " ")
          .trim();

        if (!line) {
          continue;
        }

        const step =
          this.parseNumberedStep(line);

        if (step) {
          if (!currentSection) {
            currentSection = {
              ordinal: sections.length + 1,
              title: "General",
              steps: [],
            };

            sections.push(currentSection);
          }

          currentStep = {
            ordinal:
              currentSection.steps.length + 1,
            title: step.title,
            content: step.content,
          };

          currentSection.steps.push(
            currentStep,
          );

          continue;
        }

        if (
          !currentSection &&
          this.looksLikeSectionHeading(line)
        ) {
          currentSection = {
            ordinal: sections.length + 1,
            title: line,
            steps: [],
          };

          sections.push(currentSection);

          continue;
        }

        if (currentStep) {
          currentStep.content =
            `${currentStep.content} ${line}`.trim();
        }
      }

      const totalSteps = sections.reduce(
        (count, section) =>
          count + section.steps.length,
        0,
      );

      if (totalSteps === 0) {
        throw new Error(
          "No numbered procedure steps were found in PDF. The document may use an unsupported structure or be scanned.",
        );
      }

      return {
        title,
        sections,
      };
    } finally {
      await parser.destroy();
    }
  }

  private extractTitle(
    lines: string[],
  ): string | null {
    for (const line of lines) {
      const value = line.trim();

      if (
        value.length >= 4 &&
        value.length <= 150
      ) {
        return value;
      }
    }

    return null;
  }

  private looksLikeSectionHeading(
    line: string,
  ): boolean {
    if (line.length > 120) {
      return false;
    }

    if (line.endsWith(".")) {
      return false;
    }

    return /^[A-Z][A-Za-z0-9\s/&_-]{3,119}$/.test(
      line,
    );
  }

  private parseNumberedStep(
    line: string,
  ): {
    title: string | null;
    content: string;
  } | null {
    const match = line.match(
      /^\d+[.)]\s+(.+)$/,
    );

    if (!match) {
      return null;
    }

    return {
      title: null,
      content: match[1].trim(),
    };
  }

  private filenameToTitle(
    filename: string,
  ): string {
    return filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
  }
}