export default function SourceTraceability() {
  return (
    <section className="source-preview">
      <div className="source-preview-header">
        <div>
          <span className="panel-label">
            Trust & traceability
          </span>

          <h2>Every answer is grounded in the runbook</h2>
        </div>

        <span className="source-preview-badge">
          Source-backed
        </span>
      </div>

      <p>
        Pinpoint returns the documented troubleshooting
        step together with its document, version, section,
        and step reference so engineers can verify the
        result quickly.
      </p>

      <div className="source-path">
        <span>Document</span>
        <span>›</span>
        <span>Version</span>
        <span>›</span>
        <span>Section</span>
        <span>›</span>
        <strong>Step</strong>
      </div>
    </section>
  );
}