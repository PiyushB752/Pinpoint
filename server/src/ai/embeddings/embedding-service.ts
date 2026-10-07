import { and, eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  documents,
  documentVersions,
  sections,
  steps,
} from "../../db/schema";

import { createEmbeddingProvider } from "./index";
import { buildStepEmbeddingText } from "./build-step-text";

export class EmbeddingService {
  private readonly provider = createEmbeddingProvider();

  async embedDocumentVersion(
    documentVersionId: string,
  ): Promise<void> {
    const rows = await db
      .select({
        stepId: steps.id,
        stepOrdinal: steps.ordinal,
        stepTitle: steps.title,
        stepContent: steps.content,

        sectionTitle: sections.title,

        version: documentVersions.version,

        documentTitle: documents.title,
        vendor: documents.vendor,
        system: documents.system,
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
            documentVersionId,
          ),
        ),
      );

    if (rows.length === 0) {
      throw new Error(
        "No steps found for embedding",
      );
    }

    const texts = rows.map((row) =>
      buildStepEmbeddingText({
        documentTitle: row.documentTitle,
        vendor: row.vendor,
        system: row.system,
        version: row.version,
        sectionTitle: row.sectionTitle,
        stepOrdinal: row.stepOrdinal,
        stepTitle: row.stepTitle,
        content: row.stepContent,
      }),
    );

    const embeddings =
      await this.provider.embedMany(texts);

    if (embeddings.length !== rows.length) {
      throw new Error(
        `Embedding count mismatch. Expected ${rows.length}, received ${embeddings.length}`,
      );
    }

    await db.transaction(async (tx) => {
      for (
        let index = 0;
        index < rows.length;
        index++
      ) {
        const row = rows[index];
        const embedding = embeddings[index];

        if (!embedding) {
          throw new Error(
            `Missing embedding for step ${row.stepId}`,
          );
        }

        await tx
          .update(steps)
          .set({
            embedding,
          })
          .where(
            eq(
              steps.id,
              row.stepId,
            ),
          );
      }
    });
  }
}