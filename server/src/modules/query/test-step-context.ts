import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  documents,
  documentVersions,
  sections,
  steps,
} from "../../db/schema";

import {
  findStepContext,
} from "./retrieval-repository";

import type {
  RetrievalCandidate,
} from "./query-types";

const STEP_ID =
  "91c9babb-0af3-47a2-a05d-c7206037a5b5";

async function main() {
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
      eq(
        steps.id,
        STEP_ID,
      ),
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    throw new Error(
      `Step not found: ${STEP_ID}`,
    );
  }

  const candidate: RetrievalCandidate = {
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

    relevanceScore: 0.6783,
    rerankScore: 0.6783,
  };

  console.log(
    "Testing step context...",
  );

  console.log(
    "Target step:",
    candidate.stepOrdinal,
  );

  console.log();

  const context =
    await findStepContext(
      candidate,
    );

  console.log(
    "==============================",
  );
  console.log(
    "PREVIOUS STEP",
  );
  console.log(
    "==============================",
  );

  if (context.previous) {
    console.log(
      "Step:",
      context.previous.stepOrdinal,
    );

    console.log(
      "Content:",
      context.previous.content,
    );
  } else {
    console.log("None");
  }

  console.log();

  console.log(
    "==============================",
  );
  console.log(
    "CURRENT STEP",
  );
  console.log(
    "==============================",
  );

  console.log(
    "Step:",
    context.current.stepOrdinal,
  );

  console.log(
    "Content:",
    context.current.content,
  );

  console.log();

  console.log(
    "==============================",
  );
  console.log(
    "NEXT STEP",
  );
  console.log(
    "==============================",
  );

  if (context.next) {
    console.log(
      "Step:",
      context.next.stepOrdinal,
    );

    console.log(
      "Content:",
      context.next.content,
    );
  } else {
    console.log("None");
  }

  console.log();

  console.log(
    "Step context test completed successfully.",
  );
}

main().catch((error) => {
  console.error(
    "Step context test failed:",
    error,
  );

  process.exit(1);
});