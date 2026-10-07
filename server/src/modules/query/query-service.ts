import { retrieveRelevantSteps } from "./retrieval-service";
import { RAGService } from "./rag-service";
import type { RAGResult } from "./rag-types";
import type { LLMProvider } from "../../ai/llm/types";
import {
  saveQueryHistory,
} from "./query-history-service";

export class QueryService {
  private readonly ragService: RAGService;

  constructor(
    llmProvider: LLMProvider,
  ) {
    this.ragService =
      new RAGService(llmProvider);
  }

  async query(
    userQuery: string,
  ): Promise<RAGResult> {
    const query =
      userQuery.trim();

    const retrievalResult =
      await retrieveRelevantSteps(
        query,
      );

    let result: RAGResult;

    if (
      retrievalResult.status ===
      "NO_CONFIDENT_MATCH"
    ) {
      result = {
        status:
          "NO_CONFIDENT_MATCH",

        answer: null,

        candidates:
          retrievalResult.candidates.map(
            (candidate) => ({
              documentId:
                candidate.documentId,

              documentTitle:
                candidate.documentTitle,

              versionId:
                candidate.versionId,

              version:
                candidate.version,

              vendor:
                candidate.vendor,

              system:
                candidate.system,

              sectionId:
                candidate.sectionId,

              sectionTitle:
                candidate.sectionTitle,

              sectionOrdinal:
                candidate.sectionOrdinal,

              stepId:
                candidate.stepId,

              stepOrdinal:
                candidate.stepOrdinal,

              stepTitle:
                candidate.stepTitle,
            }),
          ),

        queryHistoryId: null,
      };
    } else {
      const context =
        retrievalResult.contexts[0];

      if (!context) {
        result = {
          status:
            "GENERATION_FAILED",

          answer: null,

          candidates: [],

          queryHistoryId: null,

          error:
            "Confident retrieval returned no step context",
        };
      } else {
        result =
          await this.ragService.generateAnswer(
            query,
            context,
          );

        result.queryHistoryId = null;
      }
    }

    try {
      const relevance =
        retrievalResult.candidates.length > 0
          ? retrievalResult.candidates[0]
              .relevanceScore
          : null;

      const historyId =
        await saveQueryHistory(
          query,
          result,
          relevance,
        );

      result.queryHistoryId =
        historyId;
    } catch (error) {
      console.error(
        "Failed to save query history:",
        error,
      );
    }

    return result;
  }
}