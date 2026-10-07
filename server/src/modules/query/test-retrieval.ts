import "dotenv/config";

import {
  retrieveRelevantSteps,
} from "./retrieval-service";

async function main() {
  const query =
    "BGP neighbor is stuck in Active state. What should I check next?";

  console.log("Query:");
  console.log(query);
  console.log();

  const result =
    await retrieveRelevantSteps(
      query,
    );

  console.log(
    "Retrieval status:",
    result.status,
  );

  console.log(
    "Candidates:",
    result.candidates.length,
  );

  console.log(
    "Contexts:",
    result.contexts.length,
  );

  console.log();

  result.candidates.forEach(
    (candidate, index) => {
      console.log(
        `--- Candidate ${index + 1} ---`,
      );

      console.log(
        "Vector score:",
        candidate.relevanceScore.toFixed(
          4,
        ),
      );

      console.log(
        "Rerank score:",
        candidate.rerankScore.toFixed(
          4,
        ),
      );

      console.log(
        "Section:",
        `${candidate.sectionOrdinal}. ${candidate.sectionTitle}`,
      );

      console.log(
        "Step:",
        candidate.stepOrdinal,
      );

      console.log(
        "Content:",
        candidate.content,
      );

      console.log();
    },
  );

  if (result.contexts.length > 0) {
    console.log(
      "==============================",
    );

    console.log(
      "RETRIEVAL STEP CONTEXT",
    );

    console.log(
      "==============================",
    );

    console.log();

    result.contexts.forEach(
      (context, index) => {
        console.log(
          `--- Context ${index + 1} ---`,
        );

        console.log(
          "Previous:",
          context.previous?.content ??
            "None",
        );

        console.log(
          "Current:",
          context.current.content,
        );

        console.log(
          "Next:",
          context.next?.content ??
            "None",
        );

        console.log();
      },
    );
  }
}

main().catch((error) => {
  console.error(
    "Retrieval test failed:",
    error,
  );

  process.exit(1);
});