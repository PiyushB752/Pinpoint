import { db } from "../../db/client.js";
import {
  queryHistory,
} from "../../db/schema.js";

import type {
  RAGResult,
} from "./rag-types.js";

export async function saveQueryHistory(
  query: string,
  result: RAGResult,
  relevance: number | null,
): Promise<string> {
  const answer =
    result.answer;

  const [record] =
    await db
      .insert(queryHistory)
      .values({
        query,
        status: result.status,

        answer:
          answer?.answer ??
          null,

        explanation:
          answer?.explanation ??
          null,

        relevance:
          relevance === null
            ? null
            : Math.round(relevance * 100),

        selectedStepId:
          answer?.source.stepId ??
          null,

        selectedVersionId:
          answer?.source.versionId ??
          null,
      })
      .returning({
        id: queryHistory.id,
      });

  return record.id;
}