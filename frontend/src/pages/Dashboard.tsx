import { MetricCard, metadataFor } from "../components/MetricCard";
import type { MetricMetadata, MetricName } from "../types/evaluation";
import type { View } from "../components/AppShell";

const WORKFLOWS: {
  view: View;
  number: string;
  title: string;
  description: string;
  action: string;
  icon: string;
}[] = [
  {
    view: "llm",
    number: "01",
    title: "LLM evaluation",
    description: "Generate an answer and check whether it addresses your prompt.",
    action: "Evaluate a prompt",
    icon: "✳",
  },
  {
    view: "rag",
    number: "02",
    title: "RAG evaluation",
    description: "Generate a context-grounded answer and inspect its faithfulness.",
    action: "Test a RAG query",
    icon: "⌕",
  },
  {
    view: "existing",
    number: "03",
    title: "Existing output",
    description: "Evaluate a saved response with one or more selected metrics.",
    action: "Evaluate an output",
    icon: "↗",
  },
];

interface DashboardProps {
  metadata: MetricMetadata[] | null;
  metadataError: string | null;
  onNavigate: (view: View) => void;
  refreshStatus: () => void;
}

export function Dashboard({
  metadata,
  metadataError,
  onNavigate,
  refreshStatus,
}: DashboardProps) {
  const metrics: MetricName[] = [
    "faithfulness",
    "answer_relevancy",
    "contextual_precision",
    "contextual_recall",
    "conversation_completeness",
    "hallucination",
  ];

  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="eyebrow eyebrow-light">MODEL QUALITY · MADE VISIBLE</span>
          <h2>Evaluate with context.<br />Improve with confidence.</h2>
          <p>
            Run LLM and retrieval evaluations, review the reasoning behind each score,
            and understand what your metrics are telling you.
          </p>
          <button
            type="button"
            className="button button-light"
            onClick={() => onNavigate("existing")}
          >
            Evaluate an existing response <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="welcome-graphic" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <span>DE</span>
          </div>
          <span className="orbit-point point-one" />
          <span className="orbit-point point-two" />
          <span className="orbit-point point-three" />
        </div>
        <span className="welcome-index">EVALUATION / 001</span>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CHOOSE A WORKFLOW</span>
            <h2>Start an evaluation</h2>
          </div>
          <span className="section-caption">Three ways to assess model quality</span>
        </div>
        <div className="workflow-grid">
          {WORKFLOWS.map((workflow) => (
            <article className="workflow-card" key={workflow.view}>
              <div className="workflow-meta">
                <span className="workflow-number">{workflow.number}</span>
                <span className="workflow-icon" aria-hidden="true">{workflow.icon}</span>
              </div>
              <h3>{workflow.title}</h3>
              <p>{workflow.description}</p>
              <button
                type="button"
                className="text-action"
                onClick={() => onNavigate(workflow.view)}
              >
                {workflow.action} <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EVALUATION TOOLKIT</span>
            <h2>Six ways to measure quality</h2>
          </div>
          <button
            className="subtle-button"
            type="button"
            onClick={() => onNavigate("metrics")}
          >
            Open metrics guide <span aria-hidden="true">→</span>
          </button>
        </div>
        {metadataError && (
          <p className="info-banner" role="status">
            Live metric metadata could not be loaded ({metadataError}). The metric
            descriptions below come from the backend implementation; availability
            has not been confirmed for this session.
            <button type="button" className="inline-button" onClick={refreshStatus}>
              Retry connection
            </button>
          </p>
        )}
        {!metadataError && !metadata && (
          <p className="info-banner" role="status">Loading live metric metadata…</p>
        )}
        <div className="metric-grid">
          {metrics.map((name) => (
            <MetricCard
              key={name}
              name={name}
              metadata={metadataFor(name, metadata)}
              compact
            />
          ))}
        </div>
        <p className="note-line">
          Scores are evaluation signals, not proof of correctness. The backend does not
          store evaluation history or provide historical statistics.
        </p>
      </section>
    </div>
  );
}
