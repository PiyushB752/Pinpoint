import type { DocumentParser } from "./parser";
import type {
  ParsedDocument,
  ParsedSection,
  ParsedStep,
} from "./types";

export class MarkdownParser implements DocumentParser {
  async parse(
    input: Buffer,
    filename: string,
  ): Promise<ParsedDocument> {
    const markdown = input.toString("utf-8");

    if (!markdown.trim()) {
      throw new Error("Document is empty");
    }

    const lines = markdown.split(/\r?\n/);

    const title =
      this.extractDocumentTitle(lines) ??
      this.filenameToTitle(filename);

    const sections: ParsedSection[] = [];

    let currentSection: ParsedSection | null = null;
    let currentStep: ParsedStep | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        continue;
      }

      const heading = this.parseHeading(line);

      if (heading) {
        if (heading.level === 1) {
          continue;
        }

        if (heading.level === 2) {
          currentStep = null;

          currentSection = {
            ordinal: sections.length + 1,
            title: heading.text,
            steps: [],
          };

          sections.push(currentSection);

          continue;
        }
      }

      const step = this.parseNumberedStep(line);

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
          ordinal: currentSection.steps.length + 1,
          title: step.title,
          content: step.content,
        };

        currentSection.steps.push(currentStep);

        continue;
      }

      /*
       * If text appears immediately after a step, treat it as
       * continuation content for that step.
       *
       * This helps with:
       *
       * 1. Check the BGP state.
       *    Additional explanation about the check.
       */
      if (currentStep) {
        currentStep.content = `${currentStep.content} ${line}`;
      }
    }

    if (sections.length === 0) {
      throw new Error(
        "No sections or numbered procedure steps were found",
      );
    }

    const totalSteps = sections.reduce(
      (count, section) => count + section.steps.length,
      0,
    );

    if (totalSteps === 0) {
      throw new Error(
        "No numbered procedure steps were found",
      );
    }

    return {
      title,
      sections,
    };
  }

  private extractDocumentTitle(
    lines: string[],
  ): string | null {
    for (const line of lines) {
      const match = line.trim().match(/^#\s+(.+)$/);

      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private filenameToTitle(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
  }

  private parseHeading(
    line: string,
  ): { level: number; text: string } | null {
    const match = line.match(/^(#{1,6})\s+(.+)$/);

    if (!match) {
      return null;
    }

    return {
      level: match[1].length,
      text: match[2].trim(),
    };
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
}