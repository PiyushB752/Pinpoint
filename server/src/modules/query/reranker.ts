import type {
  RetrievalCandidate,
} from "./query-types";

export function rerankCandidates(
  _query: string,
  candidates: RetrievalCandidate[],
): RetrievalCandidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,

      // For now, semantic similarity is the
      // authoritative retrieval score.
      rerankScore:
        candidate.relevanceScore,
    }))
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore,
    );
}