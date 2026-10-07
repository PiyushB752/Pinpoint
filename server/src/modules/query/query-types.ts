export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  status:
    | "GENERATED"
    | "NO_CONFIDENT_MATCH"
    | "GENERATION_FAILED";

  queryHistoryId: string | null;

  answer: string | null;

  explanation: string | null;

  currentStep: {
    stepOrdinal: number;
    title: string | null;
    content: string;
  } | null;

  previousStep: {
    stepOrdinal: number;
    title: string | null;
    content: string;
  } | null;

  nextStep: {
    stepOrdinal: number;
    title: string | null;
    content: string;
  } | null;

  source: {
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
  } | null;

  candidates: Array<{
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
  }>;

  error?: string;
}

// ============================================================
// RETRIEVAL CANDIDATE
// ============================================================

export interface RetrievalCandidate {
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

  content: string;

  relevanceScore: number;

  rerankScore: number;
}

// ============================================================
// STEP NEIGHBOR
// ============================================================

export interface StepNeighbor {
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

  content: string;
}

// ============================================================
// RETRIEVAL CONTEXT
// ============================================================

export interface RetrievalContext {
  previous: RetrievalCandidate | null;
  current: RetrievalCandidate;
  next: RetrievalCandidate | null;
}

// Alias used by RAG layer
export type RetrievalStepContext =
  RetrievalContext;

// ============================================================
// RETRIEVAL RESULT
// ============================================================

export interface RetrievalResult {
  status:
    | "MATCH"
    | "NO_CONFIDENT_MATCH";

  candidates: RetrievalCandidate[];

  contexts: RetrievalContext[];
}