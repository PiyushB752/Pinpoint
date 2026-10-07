import {
  createEmbeddingProvider,
} from "../../ai/embeddings";

import {
  findSimilarSteps,
  findStepContext,
} from "./retrieval-repository";

import {
  getRetrievalConfig,
} from "./retrieval-config";

import {
  rerankCandidates,
} from "./reranker";

import type {
  RetrievalResult,
  RetrievalStepContext,
} from "./query-types";

export async function retrieveRelevantSteps(
  query: string,
): Promise<RetrievalResult> {
  const normalizedQuery =
    query.trim();

  if (!normalizedQuery) {
    throw new Error(
      "Query cannot be empty",
    );
  }

  const embeddingProvider =
    createEmbeddingProvider();

  const queryEmbedding =
    await embeddingProvider.embed(
      normalizedQuery,
    );

  const {
    topK,
    threshold,
  } = getRetrievalConfig();

  const candidates =
    await findSimilarSteps({
      embedding: queryEmbedding,
      topK,
    });

  const rerankedCandidates =
    rerankCandidates(
      normalizedQuery,
      candidates,
    );

  const confidentCandidates =
    rerankedCandidates.filter(
      (candidate) =>
        candidate.relevanceScore >=
        threshold,
    );

  if (
    confidentCandidates.length === 0
  ) {
    return {
      status: "NO_CONFIDENT_MATCH",
      candidates: rerankedCandidates,
      contexts: [],
    };
  }

  const contexts: RetrievalStepContext[] =
    [];

  for (
    const candidate of confidentCandidates
  ) {
    const context =
      await findStepContext(
        candidate,
      );

    contexts.push(context);
  }

  return {
    status: "MATCH",
    candidates:
      confidentCandidates,
    contexts,
  };
}