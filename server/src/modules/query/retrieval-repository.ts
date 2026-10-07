import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db/client";
import {
  documents,
  documentVersions,
  sections,
  steps,
} from "../../db/schema";

import type {
  RetrievalCandidate,
} from "./query-types";

interface RetrievalQuery {
  embedding: number[];
  topK: number;
}

export async function findSimilarSteps({
  embedding,
  topK,
}: RetrievalQuery): Promise<RetrievalCandidate[]> {
  if (embedding.length !== 1536) {
    throw new Error(
      `Invalid embedding dimension. Expected 1536, received ${embedding.length}`,
    );
  }

  if (!Number.isInteger(topK) || topK <= 0) {
    throw new Error(
      "topK must be a positive integer",
    );
  }

  const vectorString =
    `[${embedding.join(",")}]`;

  const cosineDistance = sql<number>`
    ${steps.embedding} <=> ${vectorString}::vector
  `;

  const relevanceScore = sql<number>`
    1 - (${cosineDistance})
  `;

  const rows = await db
    .select({
      stepId: steps.id,

      documentId: documents.id,
      documentTitle: documents.title,
      vendor: documents.vendor,
      system: documents.system,

      versionId: documentVersions.id,
      version: documentVersions.version,

      sectionId: sections.id,
      sectionTitle: sections.title,
      sectionOrdinal: sections.ordinal,

      stepOrdinal: steps.ordinal,
      stepTitle: steps.title,
      content: steps.content,

      relevanceScore,
    })
    .from(steps)
    .innerJoin(
      sections,
      eq(
        steps.sectionId,
        sections.id,
      ),
    )
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
    .where(
      and(
        eq(
          documentVersions.status,
          "active",
        ),
        eq(
          documentVersions.ingestionStatus,
          "indexed",
        ),
        sql`${steps.embedding} IS NOT NULL`,
      ),
    )
    .orderBy(
      sql`${relevanceScore} DESC`,
    )
    .limit(topK);

  return rows.map((row) => ({
    stepId: row.stepId,

    documentId: row.documentId,
    documentTitle: row.documentTitle,
    vendor: row.vendor,
    system: row.system,

    versionId: row.versionId,
    version: row.version,

    sectionId: row.sectionId,
    sectionTitle: row.sectionTitle,
    sectionOrdinal: row.sectionOrdinal,

    stepOrdinal: row.stepOrdinal,
    stepTitle: row.stepTitle,
    content: row.content,

    relevanceScore:
      Number(row.relevanceScore),

    rerankScore:
      Number(row.relevanceScore),
  }));
}

export async function findStepContext(
  candidate: RetrievalCandidate,
): Promise<{
  previous: RetrievalCandidate | null;
  current: RetrievalCandidate;
  next: RetrievalCandidate | null;
}> {
  const rows = await db
    .select({
      stepId: steps.id,

      documentId: documents.id,
      documentTitle: documents.title,
      vendor: documents.vendor,
      system: documents.system,

      versionId: documentVersions.id,
      version: documentVersions.version,

      sectionId: sections.id,
      sectionTitle: sections.title,
      sectionOrdinal: sections.ordinal,

      stepOrdinal: steps.ordinal,
      stepTitle: steps.title,
      content: steps.content,
    })
    .from(steps)
    .innerJoin(
      sections,
      eq(
        steps.sectionId,
        sections.id,
      ),
    )
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
    .where(
      and(
        eq(
          steps.documentVersionId,
          candidate.versionId,
        ),
        eq(
          steps.sectionId,
          candidate.sectionId,
        ),
        eq(
          documentVersions.status,
          "active",
        ),
        eq(
          documentVersions.ingestionStatus,
          "indexed",
        ),
      ),
    )
    .orderBy(
      steps.ordinal,
    );

  const currentIndex = rows.findIndex(
    (row) =>
      row.stepId === candidate.stepId,
  );

  if (currentIndex === -1) {
    throw new Error(
      `Could not find candidate step in its section: ${candidate.stepId}`,
    );
  }

  const toCandidate = (
    row: (typeof rows)[number],
  ): RetrievalCandidate => ({
    stepId: row.stepId,

    documentId: row.documentId,
    documentTitle: row.documentTitle,
    vendor: row.vendor,
    system: row.system,

    versionId: row.versionId,
    version: row.version,

    sectionId: row.sectionId,
    sectionTitle: row.sectionTitle,
    sectionOrdinal: row.sectionOrdinal,

    stepOrdinal: row.stepOrdinal,
    stepTitle: row.stepTitle,
    content: row.content,

    relevanceScore:
      row.stepId === candidate.stepId
        ? candidate.relevanceScore
        : 0,

    rerankScore:
      row.stepId === candidate.stepId
        ? candidate.rerankScore
        : 0,
  });

  const previousRow =
    rows[currentIndex - 1] ?? null;

  const nextRow =
    rows[currentIndex + 1] ?? null;

  return {
    previous: previousRow
      ? toCandidate(previousRow)
      : null,

    current: candidate,

    next: nextRow
      ? toCandidate(nextRow)
      : null,
  };
}