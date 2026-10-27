import type {
  Evaluation,
  ExistingOutputResponse,
  LlmEvaluationResponse,
  MetricResult,
  RagEvaluationResponse,
} from "../types/evaluation";

type EvaluationResponse =
  | LlmEvaluationResponse
  | RagEvaluationResponse
  | ExistingOutputResponse;

function resultsFrom(evaluation: Evaluation): MetricResult[] {
  if (evaluation.results?.length) return evaluation.results;
  if (evaluation.metric || evaluation.score != null || evaluation.error) {
    return [
      {
        metric_name: evaluation.metric || "Evaluation",
        score: evaluation.score,
        explanation: evaluation.explanation,
        error: evaluation.error,
      },
    ];
  }
  return [];
}

function scorePercent(score: number): string {
  return `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`;
}

function scoreDirection(metric: string): string {
  return metric === "hallucination" ? "Lower is better" : "Higher is better";
}

interface EvaluationResultsProps {
  response: EvaluationResponse;
  kind: "LLM evaluation" | "RAG evaluation" | "Existing output evaluation";
}

export function EvaluationResults({ response, kind }: EvaluationResultsProps) {
  const evaluation = response.evaluation;
  const results = resultsFrom(evaluation);
  const successful = results.filter(
    (result) => result.score != null && !result.error,
  ).length;
  const failed = results.filter((result) => result.error || result.score == null).length;
  const state =
    successful > 0 && failed > 0
      ? "partial"
      : successful > 0
        ? "success"
        : "failure";

  return (
    <section className="results-panel" aria-live="polite" aria-labelledby="results-title">
      <div className="section-heading results-heading">
        <div>
          <span className="eyebrow">Evaluation result</span>
          <h2 id="results-title">{kind}</h2>
        </div>
        <span className={`result-state state-${state}`}>
          {state === "success"
            ? "Completed"
            : state === "partial"
              ? "Partial results"
              : "No successful metrics"}
        </span>
      </div>

      {"context" in response && response.context && (
        <div className="result-block">
          <h3>Retrieved context</h3>
          <pre className="result-text">
            {Array.isArray(response.context)
              ? response.context.join("\n\n")
              : response.context}
          </pre>
        </div>
      )}

      {"llmResponse" in response && (
        <div className="result-block">
          <h3>Generated answer</h3>
          <pre className="result-text">{response.llmResponse}</pre>
        </div>
      )}

      {"output" in response && response.output && (
        <div className="result-block">
          <h3>Evaluated output</h3>
          <pre className="result-text">{response.output}</pre>
        </div>
      )}

      {results.length > 0 ? (
        <div className="metric-results">
          {results.map((result, index) => {
            const hasScore = result.score != null;
            return (
              <article
                className={`metric-result${result.error ? " metric-result-error" : ""}`}
                key={`${result.metric_name}-${index}`}
              >
                <div className="metric-result-header">
                  <div>
                    <h3>{result.metric_name.replace(/_/g, " ")}</h3>
                    <span className="score-direction">
                      {scoreDirection(result.metric_name)}
                    </span>
                  </div>
                  {hasScore ? (
                    <strong className="score-number">
                      {result.score!.toFixed(2)}
                    </strong>
                  ) : (
                    <span className="score-missing">No score</span>
                  )}
                </div>
                {hasScore && (
                  <div
                    className={`score-track ${result.metric_name === "hallucination" ? "score-track-inverse" : ""}`}
                    role="img"
                    aria-label={`${result.metric_name} score ${result.score!.toFixed(2)} out of 1.00. ${scoreDirection(result.metric_name)}.`}
                  >
                    <span style={{ width: scorePercent(result.score!) }} />
                  </div>
                )}
                {result.explanation && (
                  <p className="metric-explanation">{result.explanation}</p>
                )}
                {result.error && (
                  <p className="inline-error" role="alert">
                    {result.error}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="inline-error" role="alert">
          The API returned no metric results.
        </p>
      )}
    </section>
  );
}
