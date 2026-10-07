import {
  inArray,
} from "drizzle-orm";

import { db } from "../db/client";
import {
  documentVersions,
} from "../db/schema";

import {
  IngestionService,
} from "./ingestion-service";

export async function recoverIngestion(): Promise<void> {
  const versions =
    await db
      .select({
        id: documentVersions.id,
      })
      .from(documentVersions)
      .where(
        inArray(
          documentVersions.ingestionStatus,
          ["queued", "processing"],
        ),
      );

  if (versions.length === 0) {
    return;
  }

  const ingestionService =
    new IngestionService();

  for (const version of versions) {
    try {
      await ingestionService.ingestDocumentVersion(
        version.id,
      );
    } catch (error) {
      console.error(
        `Failed to recover ingestion for ${version.id}`,
        error,
      );
    }
  }
}