export interface QueryHistoryItem {
  id: string;
  query: string;
  createdAt: string;

  status?:
    | "GENERATED"
    | "NO_CONFIDENT_MATCH"
    | "GENERATION_FAILED";

  answer?: string | null;
  explanation?: string | null;
  selectedStepId?: string | null;
  selectedVersionId?: string | null;

  feedback?: Array<{
    id: string;
    type: "helpful" | "not_helpful";
    comment: string | null;
    createdAt: string;
  }>;
}

export interface Protocol {
  id: string;
  name: string;
}

export interface SourceReference {
  documentId: string;
  documentTitle: string;
  versionId?: string;
  version: string;
  vendor: string | null;
  system: string | null;
  sectionId?: string;
  section: string;
  sectionOrdinal?: number;
  stepId?: string;
  stepNumber: number;
  stepTitle?: string | null;
  sourcePath?: string;
}

export interface RetrievedStep {
  id: string;
  stepNumber: number;
  title: string;
  content: string;
}

export interface RetrievalResult {
  status:
    | "ready"
    | "answered"
    | "no_confident_match"
    | "generation_failed";

  relevance: number | null;

  answer: string | null;

  explanation?: string | null;

  queryHistoryId?: string | null;

  source: SourceReference | null;

  previousStep: RetrievedStep | null;

  currentStep: RetrievedStep | null;

  nextStep: RetrievedStep | null;

  candidates?: Array<{
    documentId: string;
    documentTitle: string;
    version: string;
    stepNumber: number;
    stepTitle: string | null;
  }>;
}