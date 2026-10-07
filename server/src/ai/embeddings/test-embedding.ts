import "dotenv/config";

import { createEmbeddingProvider } from "./index";

async function main() {
  const provider = createEmbeddingProvider();

  console.log("Generating test embedding...");

  const embedding = await provider.embed(
    "BGP neighbor is stuck in Active state. What should I check next?",
  );

  console.log("Embedding generated successfully.");
  console.log("Dimension:", embedding.length);
  console.log(
    "First 5 values:",
    embedding.slice(0, 5),
  );
  console.log(
    "All values finite:",
    embedding.every((value) =>
      Number.isFinite(value),
    ),
  );
}

main().catch((error) => {
  console.error("Embedding test failed:", error);
  process.exit(1);
});