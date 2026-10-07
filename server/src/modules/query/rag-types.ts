export interface RAGSource {
  documentId: string;
  documentTitle: string;
  versionId: string;
  version: string;
  vendor: string | null;
  system: string | null;
  sectionId: string;
  sectionTitle: string;
  sectionOrdinal: number;
  stepId: string;
  stepOrdinal: number;
  stepTitle: string | null;
}

export interface RAGStep {
  stepOrdinal: number;
  title: string | null;
  content: string;
}

export interface RAGAnswer {
  answer: string;
  explanation: string | null;
  previousStep: RAGStep | null;
  currentStep: RAGStep;
  nextStep: RAGStep | null;
  source: RAGSource;
}

export interface RAGResult {
  status:
    | "GENERATED"
    | "NO_CONFIDENT_MATCH"
    | "GENERATION_FAILED";

  answer: RAGAnswer | null;

  candidates: RAGSource[];

  queryHistoryId?: string | null;

  error?: string;
}