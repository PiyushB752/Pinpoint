import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  documents,
  documentVersions,
  sections,
  steps,
} from "../../db/schema";

import { createLLMProvider } from "../../ai/llm";
import { findStepContext } from "./retrieval-repository";
import type { RetrievalCandidate } from "./query-types";
import { RAGService } from "./rag-service";

const STEP_ID =
  "91c9babb-0af3-47a2-a05d-c7206037a5b5";

const QUERY =
  "BGP neighbor is stuck in Active state. What should I check next?";

async function main() {
  console.log("Testing RAG generation...");

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
      eq(steps.sectionId, sections.id),
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
    .where(eq(steps.id, STEP_ID))
    .limit(1);

  const row = rows[0];

  if (!row) {
    throw new Error(`Step not found: ${STEP_ID}`);
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

  const context = await findStepContext(candidate);

  if (!context) {
    throw new Error("Step context could not be found");
  }

  console.log("\nContext:");
  console.log(
    `Previous: ${
      context.previous?.content ?? "None"
    }`,
  );
  console.log(
    `Current: ${context.current.content}`,
  );
  console.log(
    `Next: ${context.next?.content ?? "None"}`,
  );

  const llm = createLLMProvider();
  
  const ragService = new RAGService(llm);

  console.log("\nGenerating answer...\n");

  const result = await ragService.generateAnswer(
    QUERY,
    context,
  );

  console.log("==============================");
  console.log("RAG STATUS");
  console.log("==============================");
  console.log(result.status);

  if (result.answer) {
    console.log("\n==============================");
    console.log("ANSWER");
    console.log("==============================");
    console.log(result.answer.answer);

    console.log("\n==============================");
    console.log("CURRENT STEP");
    console.log("==============================");
    console.log(
      `Step ${result.answer.currentStep.stepOrdinal}`,
    );
    console.log(
      result.answer.currentStep.content,
    );

    console.log("\n==============================");
    console.log("PREVIOUS STEP");
    console.log("==============================");
    console.log(
      result.answer.previousStep
        ? `Step ${result.answer.previousStep.stepOrdinal}\n${result.answer.previousStep.content}`
        : "None",
    );

    console.log("\n==============================");
    console.log("NEXT STEP");
    console.log("==============================");
    console.log(
      result.answer.nextStep
        ? `Step ${result.answer.nextStep.stepOrdinal}\n${result.answer.nextStep.content}`
        : "None",
    );

    console.log("\n==============================");
    console.log("SOURCE");
    console.log("==============================");
    console.log(
      `Document: ${result.answer.source.documentTitle}`,
    );
    console.log(
      `Version: ${result.answer.source.version}`,
    );
    console.log(
      `Section: ${result.answer.source.sectionTitle}`,
    );
    console.log(
      `Step: ${result.answer.source.stepOrdinal}`,
    );
  }

  if (result.error) {
    console.log("\nGeneration error:");
    console.log(result.error);
  }
}

main().catch((error) => {
  console.error("\nRAG test failed:");

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exit(1);
});