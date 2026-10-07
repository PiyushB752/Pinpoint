export function getLLMConfig() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  return {
    apiKey,
    model:
      process.env.GROQ_MODEL ??
      "openai/gpt-oss-120b",
  };
}