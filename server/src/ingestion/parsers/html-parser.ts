import * as cheerio from "cheerio";

import type { DocumentParser } from "./parser";
import type {
  ParsedDocument,
  ParsedSection,
  ParsedStep,
} from "./types";

export class HtmlParser implements DocumentParser {
  async parse(
    input: Buffer,
    filename: string,
  ): Promise<ParsedDocument> {
    const html = input.toString("utf-8");

    if (!html.trim()) {
      throw new Error("Document is empty");
    }

    const $ = cheerio.load(html);

    const title =
      $("h1").first().text().trim() ||
      $("title").first().text().trim() ||
      this.filenameToTitle(filename);

    const sections: ParsedSection[] = [];

    let currentSection: ParsedSection | null = null;

    $("body")
      .find("h1, h2, h3, h4, h5, h6, ol, p")
      .each((_, element) => {
        const tag = element.tagName.toLowerCase();

        if (/^h[1-6]$/.test(tag)) {
          const heading = $(element)
            .text()
            .trim();

          if (!heading) {
            return;
          }

          if (tag === "h1") {
            return;
          }

          currentSection = {
            ordinal: sections.length + 1,
            title: heading,
            steps: [],
          };

          sections.push(currentSection);

          return;
        }

        if (tag === "ol") {
          if (!currentSection) {
            currentSection = {
              ordinal: sections.length + 1,
              title: "General",
              steps: [],
            };

            sections.push(currentSection);
          }

          $(element)
            .children("li")
            .each((index, li) => {
              const content = $(li)
                .text()
                .replace(/\s+/g, " ")
                .trim();

              if (!content) {
                return;
              }

              currentSection!.steps.push({
                ordinal:
                  currentSection!.steps.length + 1,
                title: null,
                content,
              });
            });

          return;
        }

        if (tag === "p" && currentSection) {
          const content = $(element)
            .text()
            .replace(/\s+/g, " ")
            .trim();

          if (!content) {
            return;
          }

          const lastStep =
            currentSection.steps[
              currentSection.steps.length - 1
            ];

          if (lastStep) {
            lastStep.content = `${lastStep.content} ${content}`;
          }
        }
      });

    this.validate(sections);

    return {
      title,
      sections,
    };
  }

  private validate(
    sections: ParsedSection[],
  ): void {
    if (sections.length === 0) {
      throw new Error(
        "No sections found in HTML document",
      );
    }

    const totalSteps = sections.reduce(
      (count, section) =>
        count + section.steps.length,
      0,
    );

    if (totalSteps === 0) {
      throw new Error(
        "No procedure steps found in HTML document",
      );
    }
  }

  private filenameToTitle(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
  }
}