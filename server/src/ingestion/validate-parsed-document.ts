import type {
  ParsedDocument,
} from "./parsers/types";

export function validateParsedDocument(
  document: ParsedDocument,
): void {
  if (!document.title.trim()) {
    throw new Error(
      "Parsed document has no title",
    );
  }

  if (document.sections.length === 0) {
    throw new Error(
      "Parsed document contains no sections",
    );
  }

  for (const section of document.sections) {
    if (!section.title.trim()) {
      throw new Error(
        `Section ${section.ordinal} has no title`,
      );
    }

    if (section.steps.length === 0) {
      throw new Error(
        `Section "${section.title}" contains no steps`,
      );
    }

    for (const step of section.steps) {
      if (!step.content.trim()) {
        throw new Error(
          `Section "${section.title}" contains an empty step`,
        );
      }
    }
  }
}