export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedMany(texts: string[]): Promise<number[][]>;
}

export interface EmbeddingConfig {
  provider: "gemini";
  model: string;
  dimensions: number;
}