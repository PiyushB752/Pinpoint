import Groq from "groq-sdk";

import type {
  LLMMessage,
  LLMProvider,
} from "./types";

import { getLLMConfig } from "./config";

export class GroqProvider implements LLMProvider {
  private readonly client: Groq;
  private readonly model: string;

  constructor() {
    const config = getLLMConfig();

    this.client = new Groq({
      apiKey: config.apiKey,
    });

    this.model = config.model;
  }

  async generate(
    messages: LLMMessage[],
  ): Promise<string> {
    const response =
      await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0,
      });

    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      throw new Error(
        "Groq returned an empty response",
      );
    }

    return content;
  }
}