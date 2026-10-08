import fs from "node:fs/promises";
import path from "node:path";

import {
  eq,
  inArray,
} from "drizzle-orm";

import { db } from "../db/client";
import {
  documentVersions,
  sections,
  steps,
} from "../db/schema";

import { EmbeddingService } from "../ai/embeddings/embedding-service";

import { getParser } from "./parsers";
import { validateParsedDocument } from "./validate-parsed-document";

export class IngestionService {
  private readonly embeddingService =
    new EmbeddingService();

  async ingestDocumentVersion(
    documentVersionId: string,
  ): Promise<void> {
    const versionResult =
      await db
        .select()
        .from(documentVersions)
        .where(
          eq(
            documentVersions.id,
            documentVersionId,
          ),
        )
        .limit(1);

    const version = versionResult[0];

    if (!version) {
      throw new Error(
        `Document version not found: ${documentVersionId}`,
      );
    }

    if (
      !version.originalFilename
    ) {
      throw new Error(
        `Document version ${documentVersionId} has no original filename`,
      );
    }

    if (
      version.ingestionStatus !== "queued" &&
      version.ingestionStatus !== "failed"
    ) {
      throw new Error(
        `Document version cannot be ingested from status "${version.ingestionStatus}"`,
      );
    }

    await db
      .update(documentVersions)
      .set({
        ingestionStatus: "processing",
      })
      .where(
        eq(
          documentVersions.id,
          documentVersionId,
        ),
      );

    try {
      const sourcePath = path.resolve(
        process.cwd(),
        "uploads",
        version.sourcePath,
      );

      const file = await fs.readFile(
        sourcePath,
      );

      const parser = getParser(
        version.originalFilename,
      );

      const parsed =
        await parser.parse(
          file,
          version.originalFilename,
        );

      validateParsedDocument(parsed);

      /*
       * Step 1:
       * Replace the existing parsed structure.
       *
       * We intentionally do not mark the document as
       * "indexed" here because embeddings still need
       * to be generated.
       */
      await db.transaction(async (tx) => {
        const existingSections =
          await tx
            .select({
              id: sections.id,
            })
            .from(sections)
            .where(
              eq(
                sections.documentVersionId,
                documentVersionId,
              ),
            );

        const sectionIds: string[] =
          existingSections.map(
            (section) => section.id,
          );

        if (sectionIds.length > 0) {
          await tx
            .delete(steps)
            .where(
              inArray(
                steps.sectionId,
                sectionIds,
              ),
            );

          await tx
            .delete(sections)
            .where(
              inArray(
                sections.id,
                sectionIds,
              ),
            );
        }

        for (
          const parsedSection
          of parsed.sections
        ) {
          const insertedSections: Array<{
            id: string;
          }> =
            await tx
              .insert(sections)
              .values({
                documentVersionId,
                title:
                  parsedSection.title,
                ordinal:
                  parsedSection.ordinal,
              })
              .returning({
                id: sections.id,
              });

          const section =
            insertedSections[0];

          if (!section) {
            throw new Error(
              "Failed to create section",
            );
          }

          let previousStepId:
            | string
            | null = null;

          for (
            const parsedStep
            of parsedSection.steps
          ) {
            const insertedSteps:
              Array<{ id: string }> =
              await tx
                .insert(steps)
                .values({
                  documentVersionId,
                  sectionId:
                    section.id,
                  ordinal:
                    parsedStep.ordinal,
                  title:
                    parsedStep.title,
                  content:
                    parsedStep.content,
                  previousStepId,
                  nextStepId:
                    null,
                  embedding:
                    null,
                })
                .returning({
                  id: steps.id,
                });

            const step =
              insertedSteps[0];

            if (!step) {
              throw new Error(
                "Failed to create step",
              );
            }

            if (previousStepId) {
              await tx
                .update(steps)
                .set({
                  nextStepId:
                    step.id,
                })
                .where(
                  eq(
                    steps.id,
                    previousStepId,
                  ),
                );
            }

            previousStepId =
              step.id;
          }
        }
      });

      /*
       * Step 2:
       * Generate and store embeddings.
       *
       * This happens outside the database transaction
       * because Gemini is an external API.
       */
      await this.embeddingService
        .embedDocumentVersion(
          documentVersionId,
        );

      /*
       * Step 3:
       * Only mark the version as indexed after
       * parsing AND embedding have succeeded.
       */
      await db
        .update(documentVersions)
        .set({
          ingestionStatus: "indexed",
        })
        .where(
          eq(
            documentVersions.id,
            documentVersionId,
          ),
        );
    } catch (error) {
      await db
        .update(documentVersions)
        .set({
          ingestionStatus: "failed",
        })
        .where(
          eq(
            documentVersions.id,
            documentVersionId,
          ),
        );

      throw error;
    }
  }
}