"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

import QueryInput from "@/components/query/QueryInput";
import ProtocolShortcuts from "@/components/query/ProtocolShortcuts";
import QueryHistory from "@/components/query/QueryHistory";

import ResultPanel from "@/components/results/ResultPanel";
import SourceTraceability from "@/components/results/SourceTraceability";

import { protocols } from "@/data/mockData";

import type {
  QueryHistoryItem,
  RetrievalResult,
} from "@/types";

import {
  getQueryHistory,
  getQueryHistoryItem,
  submitQuery,
} from "@/lib/api";

const emptyResult: RetrievalResult = {
  status: "ready",
  relevance: null,
  answer: null,
  explanation: null,
  queryHistoryId: null,
  source: null,
  currentStep: null,
  previousStep: null,
  nextStep: null,
  candidates: [],
};

function mapResponseToResult(
  response: Awaited<
    ReturnType<typeof submitQuery>
  >,
): RetrievalResult {
  return {
    status:
      response.status === "GENERATED"
        ? "answered"
        : response.status ===
            "NO_CONFIDENT_MATCH"
          ? "no_confident_match"
          : "generation_failed",

    relevance: null,

    answer: response.answer,

    explanation:
      response.explanation,

    queryHistoryId:
      response.queryHistoryId,

    source: response.source
      ? {
          documentId:
            response.source.documentId,

          documentTitle:
            response.source.documentTitle,

          versionId:
            response.source.versionId,

          version:
            response.source.version,

          vendor:
            response.source.vendor,

          system:
            response.source.system,

          sectionId:
            response.source.sectionId,

          section:
            response.source.sectionTitle,

          sectionOrdinal:
            response.source.sectionOrdinal,

          stepId:
            response.source.stepId,

          stepNumber:
            response.source.stepOrdinal,

          stepTitle:
            response.source.stepTitle,
        }
      : null,

    currentStep:
      response.currentStep
        ? {
            id:
              response.currentStep
                ? response.source
                    ?.stepId || ""
                : "",

            stepNumber:
              response.currentStep
                .stepOrdinal,

            title:
              response.currentStep.title ||
              "",

            content:
              response.currentStep.content,
          }
        : null,

    previousStep:
      response.previousStep
        ? {
            id: "",

            stepNumber:
              response.previousStep
                .stepOrdinal,

            title:
              response.previousStep.title ||
              "",

            content:
              response.previousStep.content,
          }
        : null,

    nextStep:
      response.nextStep
        ? {
            id: "",

            stepNumber:
              response.nextStep
                .stepOrdinal,

            title:
              response.nextStep.title ||
              "",

            content:
              response.nextStep.content,
          }
        : null,

    candidates:
      (response.candidates ?? []).map(
        (candidate) => ({
          documentId:
            candidate.documentId,

          documentTitle:
            candidate.documentTitle,

          version:
            candidate.version,

          stepNumber:
            candidate.stepOrdinal,

          stepTitle:
            candidate.stepTitle,
        }),
      ),
  };
}

export default function HomePage() {
  const [query, setQuery] =
    useState("");

  const [result, setResult] =
    useState<RetrievalResult>(
      emptyResult,
    );

  const [history, setHistory] =
    useState<QueryHistoryItem[]>(
      [],
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isHistoryLoading,
    setIsHistoryLoading,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadHistory() {
    try {
      setIsHistoryLoading(true);

      const response =
        await getQueryHistory(20);

      setHistory(response.items);
    } catch (requestError) {
      console.error(
        "Failed to load query history:",
        requestError,
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function handleSearch() {
    const trimmedQuery =
      query.trim();

    if (
      !trimmedQuery ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response =
        await submitQuery({
          query: trimmedQuery,
        });

      setResult(
        mapResponseToResult(
          response,
        ),
      );

      await loadHistory();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while querying Pinpoint.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleHistorySelect(
    historyItem: QueryHistoryItem,
  ) {
    setError(null);
    setQuery(historyItem.query);
    setIsLoading(true);

    try {
      const response =
        await getQueryHistoryItem(
          historyItem.id,
        );

      setResult(
        mapResponseToResult(
          response,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load query history.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <Sidebar protocols={protocols} />

      <section className="main-area">
        <Topbar />

        <div className="workspace">
          <section className="query-section">
            <QueryInput
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
            />

            <ProtocolShortcuts
              protocols={protocols}
            />
          </section>

          {error && (
            <div className="api-error">
              <strong>API ERROR</strong>

              <span>{error}</span>
            </div>
          )}

          <section className="content-grid">
            <ResultPanel
              result={result}
            />

            <QueryHistory
              queries={history.map(
                (item) => ({
                  id: item.id,
                  query: item.query,
                  createdAt:
                    item.createdAt,
                }),
              )}
              onSelect={
                handleHistorySelect
              }
            />
          </section>

          <SourceTraceability />

          {isHistoryLoading && (
            <div className="query-loading">
              <span className="status-dot" />

              LOADING QUERY HISTORY...
            </div>
          )}

          {isLoading && (
            <div className="query-loading">
              <span className="status-dot" />

              LOADING QUERY RESULT...
            </div>
          )}
        </div>
      </section>
    </main>
  );
}