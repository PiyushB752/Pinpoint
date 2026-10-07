"use client";

import type { RetrievalResult } from "@/types";

interface ResultPanelProps {
  result: RetrievalResult;
}

export default function ResultPanel({
  result,
}: ResultPanelProps) {
  const candidates = result.candidates ?? [];

  if (result.status === "no_confident_match") {
    return (
      <section className="result-panel">
        <div className="panel-header">
          <div>
            <span className="panel-label">
              Retrieval
            </span>
            <h2>No confident match</h2>
          </div>

          <span className="result-state warning">
            Needs review
          </span>
        </div>

        <div className="no-match-state">
          <div className="no-match-icon">?</div>

          <div>
            <h3>
              No documented step matched with
              sufficient confidence.
            </h3>

            <p>
              Try adding the protocol, network symptom,
              error state, or specific condition.
            </p>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="steps-section">
            <div className="steps-section-header">
              <span>Closest matches</span>
            </div>

            <div className="steps-list">
              {candidates.map((candidate, index) => (
                <article
                  key={`${candidate.documentId}-${candidate.stepNumber}-${index}`}
                  className="step-card"
                >
                  <div className="step-card-meta">
                    Step {candidate.stepNumber}
                  </div>

                  <strong>
                    {candidate.stepTitle || "Untitled step"}
                  </strong>

                  <p>{candidate.documentTitle}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  if (result.status === "generation_failed") {
    return (
      <section className="result-panel">
        <div className="panel-header">
          <div>
            <span className="panel-label">
              Retrieval
            </span>

            <h2>Generation unavailable</h2>
          </div>

          <span className="result-state warning">
            Service issue
          </span>
        </div>

        <div className="no-match-state">
          <div className="no-match-icon">!</div>

          <div>
            <h3>
              AI answer generation is currently unavailable.
            </h3>

            <p>
              The request could not be completed. Please try
              again when the AI generation service is available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    result.status !== "answered" ||
    !result.answer
  ) {
    return (
      <section className="result-panel">
        <div className="panel-header">
          <div>
            <span className="panel-label">
              Retrieval
            </span>

            <h2>Ready</h2>
          </div>
        </div>

        <div className="empty-result">
          <h3>Ask a troubleshooting question</h3>

          <p>
            Pinpoint will find the most relevant
            documented step and show the source used
            for the answer.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="result-panel">
      <div className="panel-header">
        <div>
          <span className="panel-label">
            Retrieval result
          </span>

          <h2>Recommended step</h2>
        </div>

        {result.relevance !== null && (
          <span className="relevance">
            {result.relevance}% relevance
          </span>
        )}
      </div>

      <div className="answer-section">
        <div className="answer-header">
          <span>Current documented step</span>
        </div>

        <div className="answer-content">
          {result.answer}
        </div>

        {result.explanation && (
          <div className="answer-explanation">
            {result.explanation}
          </div>
        )}
      </div>

      {(result.previousStep ||
        result.currentStep ||
        result.nextStep) && (
        <div className="steps-section">
          <div className="steps-section-header">
            <span>Procedure context</span>
          </div>

          <div className="steps-list">
            {result.previousStep && (
              <article className="step-card">
                <div className="step-card-meta">
                  Previous · Step{" "}
                  {result.previousStep.stepNumber}
                </div>

                <strong>
                  {result.previousStep.title ||
                    "Previous step"}
                </strong>

                <p>
                  {result.previousStep.content}
                </p>
              </article>
            )}

            {result.currentStep && (
              <article className="step-card current">
                <div className="step-card-meta">
                  Current · Step{" "}
                  {result.currentStep.stepNumber}
                </div>

                <strong>
                  {result.currentStep.title ||
                    "Current step"}
                </strong>

                <p>
                  {result.currentStep.content}
                </p>
              </article>
            )}

            {result.nextStep && (
              <article className="step-card">
                <div className="step-card-meta">
                  Next · Step{" "}
                  {result.nextStep.stepNumber}
                </div>

                <strong>
                  {result.nextStep.title ||
                    "Next step"}
                </strong>

                <p>
                  {result.nextStep.content}
                </p>
              </article>
            )}
          </div>
        </div>
      )}

      {result.source && (
        <div className="source-section">
          <div className="source-section-header">
            <span>Source</span>
          </div>

          <div className="source-grid">
            <div>
              <span>Document</span>
              <strong>
                {result.source.documentTitle}
              </strong>
            </div>

            <div>
              <span>Version</span>
              <strong>
                {result.source.version}
              </strong>
            </div>

            <div>
              <span>Section</span>
              <strong>
                {result.source.section}
              </strong>
            </div>

            <div>
              <span>Step</span>
              <strong>
                {result.source.stepNumber}
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}