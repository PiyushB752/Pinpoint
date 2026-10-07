interface StepEmbeddingContext {
  documentTitle: string;
  vendor: string | null;
  system: string | null;
  version: string;
  sectionTitle: string;
  stepOrdinal: number;
  stepTitle: string | null;
  content: string;
}

export function buildStepEmbeddingText(
  context: StepEmbeddingContext,
): string {
  const lines = [
    `Document: ${context.documentTitle}`,
  ];

  if (context.vendor) {
    lines.push(
      `Vendor: ${context.vendor}`,
    );
  }

  if (context.system) {
    lines.push(
      `System: ${context.system}`,
    );
  }

  lines.push(
    `Version: ${context.version}`,
    `Section: ${context.sectionTitle}`,
    `Step: ${context.stepOrdinal}`,
  );

  if (context.stepTitle) {
    lines.push(
      `Step title: ${context.stepTitle}`,
    );
  }

  lines.push(
    `Procedure: ${context.content}`,
  );

  return lines.join("\n");
}