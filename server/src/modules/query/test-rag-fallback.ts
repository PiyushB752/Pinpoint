import "dotenv/config";

import type {
  LLMMessage,
  LLMProvider,
} from "../../ai/llm/types";

import { db } from "../../db/client";
import {
  documents,
  documentVersions,
  sections,
  steps,
} from "../../db/schema";

import { eq } from "drizzle-orm";

import {
  findStepContext,
} from "./retrieval-repository";

import { RAGService } from "./rag-service";

class FailingLLMProvider
  implements LLMProvider
{
  async generate(
    _messages: LLMMessage[],
  ): Promise<string> {
    throw new Error(
      "Simulated Groq failure",
    );
  }
}

async function main() {
  console.log(
    "Testing RAG generation fallback...",
  );

  const targetStepId =
    "91c9babb-0af3-47a2-a05d-c7206037a5b5";

  const [targetStep] =
    await db
      .select()
      .from(steps)
      .where(
        eq(
          steps.id,
          targetStepId,
        ),
      )
      .limit(1);

  if (!targetStep) {
    throw new Error(
      "Target step not found",
    );
  }

  const context =
    await findStepContext(
      {
        stepId: targetStep.id,
        documentId: "",
        documentTitle: "",
        vendor: null,
        system: null,
        versionId:
          targetStep.documentVersionId,
        version: "",
        sectionId:
          targetStep.sectionId,
        sectionTitle: "",
        sectionOrdinal: 1,
        stepOrdinal:
          targetStep.ordinal,
        stepTitle:
          targetStep.title,
        content:
          targetStep.content,
        relevanceScore: 1,
        rerankScore: 1,
      },
    );

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
    `Next: ${
      context.next?.content ?? "None"
    }`,
  );

  const ragService =
    new RAGService(
      new FailingLLMProvider(),
    );

  const result =
    await ragService.generateAnswer(
      "Verify the configured peer address.",
      context,
    );

  console.log(
    "\n==============================",
  );
  console.log("RAG FALLBACK RESULT");
  console.log(
    "==============================",
  );

  console.log(
    `Status: ${result.status}`,
  );

  console.log(
    `Answer: ${
      result.answer?.answer ?? "null"
    }`,
  );

  console.log(
    `Explanation: ${
      result.answer?.explanation ?? "null"
    }`,
  );

  console.log(
    `Error: ${result.error ?? "none"}`,
  );

  if (
    result.status !==
    "GENERATION_FAILED"
  ) {
    throw new Error(
      `Expected GENERATION_FAILED, received ${result.status}`,
    );
  }

  if (!result.answer) {
    throw new Error(
      "Fallback must contain the authoritative answer",
    );
  }

  if (
    result.answer.answer !==
    "Verify the configured peer address."
  ) {
    throw new Error(
      "Fallback answer does not match the documented step",
    );
  }

  if (
    result.answer.explanation !== null
  ) {
    throw new Error(
      "Fallback explanation must be null",
    );
  }

  console.log(
    "\nRAG fallback test passed successfully.",
  );
}

main().catch((error) => {
  console.error(
    "\nRAG fallback test failed:",
  );

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exit(1);
});