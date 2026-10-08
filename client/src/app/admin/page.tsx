"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

import { protocols } from "@/data/mockData";
import { getAdminMetrics } from "@/lib/api";
import type { AdminMetrics } from "@/lib/api";

interface SystemHealth {
  status: "ok" | "degraded" | "error";
  database?: "connected" | "disconnected";
  embedding?: "configured" | "not_configured";
  llm?: "configured" | "not_configured";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPage() {
  const [metrics, setMetrics] =
    useState<AdminMetrics | null>(null);

  const [health, setHealth] =
    useState<SystemHealth | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        setError(null);

        const [metricsResponse, healthResponse] =
          await Promise.all([
            getAdminMetrics(),
            fetch(`${API_BASE_URL}/health`, {
              method: "GET",
              cache: "no-store",
            }),
          ]);

        if (!healthResponse.ok) {
          throw new Error(
            "Backend health check failed.",
          );
        }

        const healthData =
          (await healthResponse.json()) as SystemHealth;

        setMetrics(metricsResponse);
        setHealth(healthData);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load admin data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAdminData();
  }, []);

  const systemOnline =
    health?.status === "ok";

  return (
    <main className="app-shell">
      <Sidebar protocols={protocols} />

      <section className="main-area">
        <Topbar />

        <div className="workspace admin-workspace">
          <div className="admin-header">
            <div>
              <span className="panel-label">
                Administration
              </span>

              <h1>System overview</h1>

              <p>
                Monitor retrieval activity and the
                current state of the Pinpoint
                knowledge base.
              </p>
            </div>

            <Link
              href="/"
              className="admin-back-link"
            >
              Back to workspace
            </Link>
          </div>

          {error && (
            <div className="api-error">
              <strong>Unable to load</strong>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="query-loading">
              <span className="status-dot" />
              Loading system information...
            </div>
          ) : (
            <>
              {metrics && (
                <div className="admin-metrics-grid">
                  <MetricCard
                    label="Queries today"
                    value={metrics.queriesToday}
                    description="Investigation queries recorded today"
                  />

                  <MetricCard
                    label="Low confidence"
                    value={
                      metrics.lowConfidenceQueries
                    }
                    description="Queries without a confident match"
                  />

                  <MetricCard
                    label="Documents indexed"
                    value={metrics.documentsIndexed}
                    description="Currently active document versions"
                  />

                  <MetricCard
                    label="Average relevance"
                    value={
                      metrics.averageRetrievalRelevance ===
                      null
                        ? "—"
                        : `${metrics.averageRetrievalRelevance}%`
                    }
                    description="Average retrieval relevance"
                  />
                </div>
              )}

              <section className="admin-status-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-label">
                      System
                    </span>

                    <h2>Service status</h2>
                  </div>

                  <span
                    className={`result-state ${
                      systemOnline
                        ? "success"
                        : "warning"
                    }`}
                  >
                    {systemOnline
                      ? "Operational"
                      : "Degraded"}
                  </span>
                </div>

                <div className="admin-status-grid">
                  <StatusItem
                    label="Retrieval engine"
                    value={
                      systemOnline
                        ? "Operational"
                        : "Unavailable"
                    }
                  />

                  <StatusItem
                    label="Vector index"
                    value={
                      health?.database ===
                      "connected"
                        ? "Operational"
                        : "Check required"
                    }
                  />

                  <StatusItem
                    label="AI generation"
                    value={
                      health?.llm === "configured"
                        ? "Operational"
                        : "Not configured"
                    }
                  />

                  <StatusItem
                    label="Document ingestion"
                    value={
                      systemOnline
                        ? "Operational"
                        : "Check required"
                    }
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>

      <strong>{value}</strong>

      <p>{description}</p>
    </article>
  );
}

function StatusItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const operational =
    value === "Operational";

  return (
    <div>
      <span>{label}</span>

      <strong
        className={
          operational
            ? "status-operational"
            : "status-attention"
        }
      >
        {value}
      </strong>
    </div>
  );
}