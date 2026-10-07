import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { createLLMProvider } from "../../ai/llm/index.js";
import { QueryService } from "./query-service.js";
import type {
  QueryRequest,
  QueryResponse,
} from "./query-types.js";

const llmProvider =
  createLLMProvider();

const queryService =
  new QueryService(llmProvider);

export async function queryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body =
    request.body as QueryRequest;

  const query =
    typeof body?.query === "string"
      ? body.query.trim()
      : "";

  if (!query) {
    return reply.code(400).send({
      status: "NO_CONFIDENT_MATCH",

      queryHistoryId: null,

      answer: null,

      explanation: null,

      currentStep: null,

      previousStep: null,

      nextStep: null,

      source: null,

      candidates: [],

      error:
        "Query must be a non-empty string",
    });
  }

  try {
    const result =
      await queryService.query(query);

    const response: QueryResponse = {
      status: result.status,

      queryHistoryId:
        result.queryHistoryId ??
        null,

      answer:
        result.answer?.answer ??
        null,

      explanation:
        result.answer?.explanation ??
        null,

      currentStep:
        result.answer?.currentStep ??
        null,

      previousStep:
        result.answer?.previousStep ??
        null,

      nextStep:
        result.answer?.nextStep ??
        null,

      source:
        result.answer?.source ??
        null,

      candidates:
        result.candidates,

      ...(result.error
        ? {
            error: result.error,
          }
        : {}),
    };

    return reply.send(response);
  } catch (error) {
    request.log.error(
      error,
      "Query request failed",
    );

    return reply.code(500).send({
      status: "GENERATION_FAILED",

      queryHistoryId: null,

      answer: null,

      explanation: null,

      currentStep: null,

      previousStep: null,

      nextStep: null,

      source: null,

      candidates: [],

      error:
        "Query processing failed",
    });
  }
}