import type { EmbeddingConfig } from "./types";

export function getEmbeddingConfig(): EmbeddingConfig {
  const provider =
    process.env.EMBEDDING_PROVIDER ?? "gemini";

  const model =
    process.env.EMBEDDING_MODEL ??
    "gemini-embedding-001";

  const dimensions = Number(
    process.env.EMBEDDING_DIMENSION ?? "1536",
  );

  if (provider !== "gemini") {
    throw new Error(
      `Unsupported embedding provider: ${provider}`,
    );
  }

  if (!model) {
    throw new Error(
      "EMBEDDING_MODEL is required",
    );
  }

  if (
    !Number.isInteger(dimensions) ||
    dimensions <= 0
  ) {
    throw new Error(
      "EMBEDDING_DIMENSION must be a positive integer",
    );
  }

  if (dimensions !== 1536) {
    throw new Error(
      "EMBEDDING_DIMENSION must be 1536 because the database uses vector(1536)",
    );
  }

  return {
    provider,
    model,
    dimensions,
  };
}