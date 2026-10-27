import { useState, type FormEvent } from "react";
import { EvaluationResults } from "../components/EvaluationResults";
import { ModelOptions, RequestError, SubmitButton } from "../components/FormFields";
import { api } from "../services/api";
import type { RagEvaluationResponse } from "../types/evaluation";

const RAG_METRICS = ["faithfulness", "answer_relevancy", "hallucination"] as const;

export function RagEvaluation() {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature] = useState(0.7);
  const [metric, setMetric] = useState<(typeof RAG_METRICS)[number]>("faithfulness");
  const [response, setResponse] = useState<RagEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!query.trim()) {
      setError("Enter a query before starting an evaluation.");
      return;
    }
    if (!model.trim()) {
      setError("Enter a model name.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      setResponse(
        await api.evaluateRag({
          query: query.trim(),
          model: model.trim(),
          temperature,
          metric,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred while evaluating the RAG query.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-layout">
      <section className="form-panel">
        <div className="section-heading form-panel-heading">
          <div>
            <span className="eyebrow">RETRIEVE + GENERATE + EVALUATE</span>
            <h2>Test a RAG query</h2>
          </div>
          <span className="step-chip">02 / 03</span>
        </div>
        <p className="panel-description">
          The backend retrieves its demonstration passage, generates an answer using
          that context, and evaluates the result.
        </p>

        <form className="evaluation-form" onSubmit={submit}>
          <label className="field">
            <span>Query <em>Required</em></span>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="For example: What experience does the resume describe?"
              rows={5}
              required
            />
            <small>The backend uses keyword matching to select a demonstration passage.</small>
          </label>

          <ModelOptions
            model={model}
            temperature={temperature}
            onModelChange={setModel}
            onTemperatureChange={setTemperature}
          />

          <label className="field field-select">
            <span>Evaluation metric</span>
            <select
              value={metric}
              onChange={(event) =>
                setMetric(event.target.value as (typeof RAG_METRICS)[number])
              }
            >
              <option value="faithfulness">Faithfulness — grounded in context</option>
              <option value="answer_relevancy">Answer relevancy — addresses the query</option>
              <option value="hallucination">Hallucination — lower score is better</option>
            </select>
            <small>
              Contextual precision and recall need a reference answer, which this route
              does not accept.
            </small>
          </label>

          <div className="info-banner compact-banner">
            This workflow uses the backend's hard-coded demonstration passages; it does
            not query a document or vector database.
          </div>
          {error && <RequestError message={error} />}
          <div className="form-actions">
            <span className="form-footnote">No evaluation history is stored.</span>
            <SubmitButton loading={loading} label="Run evaluation" />
          </div>
        </form>
      </section>

      <aside className="workflow-aside">
        <div className="aside-icon" aria-hidden="true">⌕</div>
        <span className="eyebrow">RAG QUALITY CHECK</span>
        <h3>See what supports the answer</h3>
        <p className="aside-copy">
          Faithfulness compares the generated response with the context selected by the
          existing backend. Review both pieces of text alongside the metric explanation.
        </p>
        <div className="aside-callout">
          <strong>Demo retrieval</strong>
          <span>Keyword matching over bundled sample passages. Not production retrieval.</span>
        </div>
      </aside>

      {response && (
        <div className="results-column">
          <EvaluationResults response={response} kind="RAG evaluation" />
          <details className="request-details">
            <summary>Request details</summary>
            <dl>
              <div><dt>Model</dt><dd>{response.model}</dd></div>
              <div><dt>Provider</dt><dd>{response.provider}</dd></div>
              <div><dt>Temperature</dt><dd>{response.temperature}</dd></div>
            </dl>
          </details>
        </div>
      )}
    </div>
  );
}
