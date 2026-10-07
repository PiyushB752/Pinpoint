export function getRetrievalConfig() {
  const topK = Number(
    process.env.RETRIEVAL_TOP_K ?? "5",
  );

  const threshold = Number(
    process.env.RETRIEVAL_MIN_SCORE ?? "0.70",
  );

  if (
    !Number.isInteger(topK) ||
    topK <= 0
  ) {
    throw new Error(
      "RETRIEVAL_TOP_K must be a positive integer",
    );
  }

  if (
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new Error(
      "RETRIEVAL_MIN_SCORE must be between 0 and 1",
    );
  }

  return {
    topK,
    threshold,
  };
}