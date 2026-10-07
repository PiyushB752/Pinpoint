import "dotenv/config";

import type {
  LLMMessage,
  LLMProvider,
} from "../../ai/llm/types";

import { QueryService } from "./query-service";

class TestLLMProvider implements LLMProvider {
  async generate(
    messages: LLMMessage[],
  ): Promise<string> {
    console.log("\nLLM PROVIDER CALLED");

    if (messages.length !== 2) {
      throw new Error(
        `Expected 2 LLM messages, received ${messages.length}`,
      );
    }

    return "The configured peer address should be verified because this is the current documented troubleshooting step.";
  }
}

async function main() {
  console.log(
    "Testing QueryService MATCH path...",
  );

  const query =
    "Verify the configured peer address.";

  const llmProvider =
    new TestLLMProvider();

  const queryService =
    new QueryService(llmProvider);

  const result =
    await queryService.query(query);

  console.log(
    "\n==============================",
  );
  console.log("QUERY RESULT");
  console.log(
    "==============================",
  );

  console.log(
    `Status: ${result.status}`,
  );

  console.log(
    `Candidates: ${result.candidates.length}`,
  );

  if (result.answer) {
    console.log(
      `Answer: ${result.answer.answer}`,
    );

    console.log(
      `Current Step: ${result.answer.currentStep.stepOrdinal}`,
    );

    console.log(
      `Current Content: ${result.answer.currentStep.content}`,
    );

    console.log(
      `Explanation: ${result.answer.explanation}`,
    );
  } else {
    console.log("Answer: null");
  }

  if (result.status !== "GENERATED") {
    throw new Error(
      `Expected GENERATED, received ${result.status}`,
    );
  }

  if (!result.answer) {
    throw new Error(
      "GENERATED result must contain an answer",
    );
  }

  // The authoritative answer must come
  // directly from the retrieved document step.
  if (
    result.answer.answer !==
    "Verify the configured peer address."
  ) {
    throw new Error(
      "Authoritative answer does not match the documented step",
    );
  }

  if (
    result.answer.currentStep.content !==
    "Verify the configured peer address."
  ) {
    throw new Error(
      "QueryService returned the wrong current step",
    );
  }

  if (
    result.answer.source.stepOrdinal !== 2
  ) {
    throw new Error(
      `Expected source step 2, received ${result.answer.source.stepOrdinal}`,
    );
  }

  console.log(
    "\nQueryService MATCH test passed successfully.",
  );
}

main().catch((error) => {
  console.error(
    "\nQueryService MATCH test failed:",
  );

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exit(1);
});