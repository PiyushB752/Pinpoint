import { GoogleGenAI } from "@google/genai";

import type {
  EmbeddingConfig,
  EmbeddingProvider,
} from "./types";

export class GeminiEmbeddingProvider
  implements EmbeddingProvider
{
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(config: EmbeddingConfig) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is required when using the Gemini embedding provider",
      );
    }

    this.client = new GoogleGenAI({
      apiKey,
    });

    this.model = config.model;
    this.dimensions = config.dimensions;
  }

  async embed(text: string): Promise<number[]> {
    const normalizedText = text.trim();

    if (!normalizedText) {
      throw new Error(
        "Cannot generate an embedding for empty text",
      );
    }

    const response =
      await this.client.models.embedContent({
        model: this.model,
        contents: normalizedText,
        config: {
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: this.dimensions,
        },
      });

    const embedding =
      response.embeddings?.[0]?.values;

    if (!embedding) {
      throw new Error(
        "Gemini embedding response did not contain an embedding",
      );
    }

    this.validateDimensions(embedding);

    return embedding;
  }

  async embedMany(
    texts: string[],
  ): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const normalizedTexts = texts.map((text) =>
      text.trim(),
    );

    if (
      normalizedTexts.some(
        (text) => text.length === 0,
      )
    ) {
      throw new Error(
        "Cannot generate embeddings for empty text",
      );
    }

    const embeddings: number[][] = [];

    for (const text of normalizedTexts) {
      const response =
        await this.client.models.embedContent({
          model: this.model,
          contents: text,
          config: {
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: this.dimensions,
          },
        });

      const embedding =
        response.embeddings?.[0]?.values;

      if (!embedding) {
        throw new Error(
          "Gemini embedding response did not contain an embedding",
        );
      }

      this.validateDimensions(embedding);

      embeddings.push(embedding);
    }

    return embeddings;
  }

  private validateDimensions(
    embedding: number[],
  ): void {
    if (embedding.length !== this.dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimensions}, received ${embedding.length}`,
      );
    }

    if (
      embedding.some(
        (value) => !Number.isFinite(value),
      )
    ) {
      throw new Error(
        "Embedding contains a non-finite value",
      );
    }
  }
}