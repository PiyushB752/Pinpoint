import {
  findStepNeighbor,
} from "./context-repository";

import type {
  RetrievalCandidate,
  RetrievalContext,
} from "./query-types";

export async function buildRetrievalContext(
  candidate: RetrievalCandidate,
): Promise<RetrievalContext> {
  const currentStepResult =
    await findStepNeighbor(
      candidate.stepId,
    );

  if (!currentStepResult) {
    throw new Error(
      `Retrieved step not found: ${candidate.stepId}`,
    );
  }

  return {
    previous: null,
    current: candidate,
    next: null,
  };
}