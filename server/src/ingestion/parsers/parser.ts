import type { ParsedDocument } from "./types";

export interface DocumentParser {
  parse(input: Buffer, filename: string): Promise<ParsedDocument>;
}