import type { LLMProvider } from "./types";
import { GroqProvider } from "./groq-provider";

export function createLLMProvider(): LLMProvider {
  const provider =
    process.env.LLM_PROVIDER ?? "groq";

  switch (provider) {
    case "groq":
      return new GroqProvider();

    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}`,
      );
  }
}