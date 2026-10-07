export interface LLMMessage {
  role: "system" | "user";
  content: string;
}

export interface LLMProvider {
  generate(messages: LLMMessage[]): Promise<string>;
}