const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  status: "GENERATED" | "NO_CONFIDENT_MATCH" | "GENERATION_FAILED";
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

  candidates?: Array<{
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

export interface QueryHistoryItem {
  id: string;
  query: string;
  status: "GENERATED" | "NO_CONFIDENT_MATCH" | "GENERATION_FAILED";
  answer: string | null;
  explanation: string | null;
  selectedStepId: string | null;
  selectedVersionId: string | null;
  createdAt: string;
  feedback: Array<{
    id: string;
    type: "helpful" | "not_helpful";
    comment: string | null;
    createdAt: string;
  }>;
}

export interface QueryHistoryResponse {
  items: QueryHistoryItem[];
  count: number;
}

export async function submitQuery(
  payload: QueryRequest,
): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || body?.message || "Failed to submit query.");
  }

  return body as QueryResponse;
}

export async function getQueryHistory(
  limit = 20,
): Promise<QueryHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/query/history?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || "Failed to load query history.",
    );
  }

  return body as QueryHistoryResponse;
}

export async function getQueryHistoryItem(id: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query/history/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || "Failed to load query history item.",
    );
  }

  return body as QueryResponse;
}

export async function submitFeedback(payload: {
  queryHistoryId: string;
  type: "helpful" | "not_helpful";
  comment?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || "Failed to submit feedback.",
    );
  }

  return body;
}

export interface AdminMetrics {
  queriesToday: number;
  lowConfidenceQueries: number;
  documentsIndexed: number;
  averageRetrievalRelevance: number | null;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const response = await fetch(`${API_BASE_URL}/admin/metrics`, {
    method: "GET",
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || "Failed to load admin metrics.",
    );
  }

  return body as AdminMetrics;
}

export interface SystemHealth {
  status: "ok" | "degraded" | "error";
  database?: "connected" | "disconnected";
  embedding?: "configured" | "not_configured";
  llm?: "configured" | "not_configured";
}

export async function getHealth(): Promise<SystemHealth> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || "Backend health check failed.",
    );
  }

  return body as SystemHealth;
}
