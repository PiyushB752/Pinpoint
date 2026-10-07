import { eq } from "drizzle-orm";

import { db } from "../../db/client.js";
import {
  steps,
  documents,
  documentVersions,
  sections,
} from "../../db/schema.js";

import type {
  StepNeighbor,
} from "./query-types.js";

export async function findStepNeighbor(
  stepId: string | null,
): Promise<StepNeighbor | null> {
  if (!stepId) {
    return null;
  }

  const rows = await db
    .select({
      stepId: steps.id,
      stepOrdinal: steps.ordinal,
      stepTitle: steps.title,
      content: steps.content,

      documentId: documents.id,
      documentTitle: documents.title,

      versionId: documentVersions.id,
      version: documentVersions.version,

      vendor: documents.vendor,
      system: documents.system,

      sectionId: sections.id,
      sectionTitle: sections.title,
      sectionOrdinal: sections.ordinal,
    })
    .from(steps)
    .innerJoin(
      documentVersions,
      eq(
        steps.documentVersionId,
        documentVersions.id,
      ),
    )
    .innerJoin(
      documents,
      eq(
        documentVersions.documentId,
        documents.id,
      ),
    )
    .innerJoin(
      sections,
      eq(
        steps.sectionId,
        sections.id,
      ),
    )
    .where(
      eq(
        steps.id,
        stepId,
      ),
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    stepId: row.stepId,
    stepOrdinal: row.stepOrdinal,
    stepTitle: row.stepTitle,
    content: row.content,

    documentId: row.documentId,
    documentTitle: row.documentTitle,

    versionId: row.versionId,
    version: row.version,

    vendor: row.vendor,
    system: row.system,

    sectionId: row.sectionId,
    sectionTitle: row.sectionTitle,
    sectionOrdinal: row.sectionOrdinal,
  };
}

// Backward-compatible alias.
export const getStepNeighbor =
  findStepNeighbor;