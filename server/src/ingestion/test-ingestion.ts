import "dotenv/config";

import { IngestionService } from "./ingestion-service";

const DOCUMENT_VERSION_ID =
  "22222222-2222-4222-8222-222222222222";

async function main() {
  const ingestionService =
    new IngestionService();

  console.log(
    "Starting ingestion...",
  );

  console.log(
    "Document version:",
    DOCUMENT_VERSION_ID,
  );

  await ingestionService.ingestDocumentVersion(
    DOCUMENT_VERSION_ID,
  );

  console.log();
  console.log(
    "Ingestion completed successfully.",
  );
}

main().catch((error) => {
  console.error();
  console.error(
    "Ingestion failed:",
  );
  console.error(error);

  process.exit(1);
});