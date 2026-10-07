import type { LLMProvider } from "../../ai/llm/types";

import type { RetrievalStepContext } from "./query-types";

import type {
  RAGAnswer,
  RAGResult,
  RAGSource,
} from "./rag-types";

import { buildRAGPrompt } from "./rag-prompt";

export class RAGService {
  constructor(
    private readonly llm: LLMProvider,
  ) {}

  async generateAnswer(
    query: string,
    context: RetrievalStepContext,
  ): Promise<RAGResult> {
    const source =
      this.buildSource(context);

    try {
      const prompt =
        buildRAGPrompt(
          query,
          context,
        );

      const response =
        await this.llm.generate([
          {
            role: "system",
            content:
              "You are a strict documentation-grounded NOC runbook assistant. Never invent or replace documented steps.",
          },
          {
            role: "user",
            content: prompt,
          },
        ]);

      const explanation =
        this.validateExplanation(
          response,
        );

      const answer: RAGAnswer = {
        // The retrieved document step is authoritative.
        answer:
          context.current.content,

        // LLM output is supplementary only.
        explanation,

        currentStep: {
          stepOrdinal:
            context.current.stepOrdinal,
          title:
            context.current.stepTitle,
          content:
            context.current.content,
        },

        previousStep:
          context.previous
            ? {
                stepOrdinal:
                  context.previous.stepOrdinal,
                title:
                  context.previous.stepTitle,
                content:
                  context.previous.content,
              }
            : null,

        nextStep:
          context.next
            ? {
                stepOrdinal:
                  context.next.stepOrdinal,
                title:
                  context.next.stepTitle,
                content:
                  context.next.content,
              }
            : null,

        source,
      };

      return {
        status: "GENERATED",
        answer,
        candidates: [source],
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown LLM generation error";

      // Deterministic fallback:
      // return the retrieved documented step even
      // when LLM generation fails.
      const fallbackAnswer: RAGAnswer = {
        answer:
          context.current.content,

        explanation: null,

        currentStep: {
          stepOrdinal:
            context.current.stepOrdinal,
          title:
            context.current.stepTitle,
          content:
            context.current.content,
        },

        previousStep:
          context.previous
            ? {
                stepOrdinal:
                  context.previous.stepOrdinal,
                title:
                  context.previous.stepTitle,
                content:
                  context.previous.content,
              }
            : null,

        nextStep:
          context.next
            ? {
                stepOrdinal:
                  context.next.stepOrdinal,
                title:
                  context.next.stepTitle,
                content:
                  context.next.content,
              }
            : null,

        source,
      };

      return {
        status: "GENERATION_FAILED",
        answer: fallbackAnswer,
        candidates: [source],
        error: message,
      };
    }
  }

  private buildSource(
    context: RetrievalStepContext,
  ): RAGSource {
    const current =
      context.current;

    return {
      documentId:
        current.documentId,

      documentTitle:
        current.documentTitle,

      versionId:
        current.versionId,

      version:
        current.version,

      vendor:
        current.vendor,

      system:
        current.system,

      sectionId:
        current.sectionId,

      sectionTitle:
        current.sectionTitle,

      sectionOrdinal:
        current.sectionOrdinal,

      stepId:
        current.stepId,

      stepOrdinal:
        current.stepOrdinal,

      stepTitle:
        current.stepTitle,
    };
  }

  private validateExplanation(
    response: string,
  ): string {
    const explanation =
      response
        .trim()
        .replace(
          /^```text\s*/i,
          "",
        )
        .replace(
          /^```\s*/i,
          "",
        )
        .replace(
          /\s*```$/,
          "",
        )
        .trim();

    if (!explanation) {
      throw new Error(
        "Groq returned an empty RAG explanation",
      );
    }

    return explanation;
  }
}