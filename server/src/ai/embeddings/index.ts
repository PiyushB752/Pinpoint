import { getEmbeddingConfig } from "./config";
import { GeminiEmbeddingProvider } from "./gemini-provider";
import type { EmbeddingProvider } from "./types";

export function createEmbeddingProvider(): EmbeddingProvider {
  const config = getEmbeddingConfig();

  switch (config.provider) {
    case "gemini":
      return new GeminiEmbeddingProvider(config);

    default:
      throw new Error(
        `Unsupported embedding provider: ${config.provider}`,
      );
  }
}