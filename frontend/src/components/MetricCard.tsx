import type { MetricMetadata, MetricName } from "../types/evaluation";

export const METRIC_CATALOG: Record<
  MetricName,
  { title: string; description: string; required: string; direction: string }
> = {
  faithfulness: {
    title: "Faithfulness",
    description: "Checks whether answer claims are grounded in the supplied context.",
    required: "Output; context is recommended by the evaluator.",
    direction: "Higher is better",
  },
  answer_relevancy: {
    title: "Answer relevancy",
    description: "Checks whether the response addresses the user's question.",
    required: "Query and output",
    direction: "Higher is better",
  },
  contextual_precision: {
    title: "Contextual precision",
    description: "Checks whether retrieved context is relevant to the reference answer.",
    required: "Context, output, and expected output",
    direction: "Higher is better",
  },
  contextual_recall: {
    title: "Contextual recall",
    description: "Checks whether retrieved context contains information needed by the reference answer.",
    required: "Context, output, and expected output",
    direction: "Higher is better",
  },
  conversation_completeness: {
    title: "Conversation completeness",
    description: "Evaluates whether a conversation covers the necessary information.",
    required: "Conversation messages",
    direction: "Higher is better",
  },
  hallucination: {
    title: "Hallucination",
    description: "Measures unsupported or conflicting claims against the supplied context.",
    required: "Output and context",
    direction: "Lower is better",
  },
};

export function metadataFor(
  name: MetricName,
  metadata: MetricMetadata[] | null,
): MetricMetadata | undefined {
  return metadata?.find((metric) => metric.name === name);
}

interface MetricCardProps {
  name: MetricName;
  metadata?: MetricMetadata;
  compact?: boolean;
}

export function MetricCard({ name, metadata, compact = false }: MetricCardProps) {
  const info = METRIC_CATALOG[name];
  const description = metadata?.description || info.description;
  const direction =
    metadata?.higher_is_better === false ? "Lower is better" : info.direction;

  return (
    <article className={`metric-card${compact ? " metric-card-compact" : ""}`}>
      <div className="metric-card-heading">
        <span className={`metric-glyph metric-${name}`} aria-hidden="true">
          {name === "hallucination" ? "!" : name === "conversation_completeness" ? "↔" : "✓"}
        </span>
        <span className="metric-direction">{direction}</span>
      </div>
      <h3>{info.title}</h3>
      <p>{description}</p>
      {!compact && (
        <p className="metric-requirements">
          <strong>Inputs:</strong>{" "}
          {metadata?.required_fields?.length
            ? metadata.required_fields.join(", ")
            : info.required}
          {metadata?.recommended_fields?.length
            ? ` · Recommended: ${metadata.recommended_fields.join(", ")}`
            : ""}
        </p>
      )}
    </article>
  );
}
