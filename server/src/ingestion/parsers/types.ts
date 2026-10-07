export interface ParsedStep {
  ordinal: number;
  title: string | null;
  content: string;
}

export interface ParsedSection {
  ordinal: number;
  title: string;
  steps: ParsedStep[];
}

export interface ParsedDocument {
  title: string;
  sections: ParsedSection[];
}