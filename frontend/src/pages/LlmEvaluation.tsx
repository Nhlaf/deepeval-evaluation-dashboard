import { useState, type FormEvent } from "react";
import { EvaluationResults } from "../components/EvaluationResults";
import { ModelOptions, RequestError, SubmitButton } from "../components/FormFields";
import { api } from "../services/api";
import type { LlmEvaluationResponse } from "../types/evaluation";

export function LlmEvaluation() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature] = useState(0.7);
  const [response, setResponse] = useState<LlmEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!prompt.trim()) {
      setError("Enter a prompt before starting an evaluation.");
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
      const result = await api.evaluateLlm({
        prompt: prompt.trim(),
        model: model.trim(),
        temperature,
        metric: "answer_relevancy",
      });
      setResponse(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred while evaluating the prompt.",
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
            <span className="eyebrow">GENERATE + EVALUATE</span>
            <h2>Test a prompt</h2>
          </div>
          <span className="step-chip">01 / 03</span>
        </div>
        <p className="panel-description">
          The Express API generates a response with your selected model, then asks
          DeepEval to assess answer relevancy.
        </p>

        <form className="evaluation-form" onSubmit={submit}>
          <label className="field">
            <span>Prompt <em>Required</em></span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask a question or describe the response you want to evaluate…"
              rows={6}
              required
            />
            <small>This prompt is both sent to the model and used as the evaluation query.</small>
          </label>

          <ModelOptions
            model={model}
            temperature={temperature}
            onModelChange={setModel}
            onTemperatureChange={setTemperature}
          />

          <label className="field field-select">
            <span>Evaluation metric</span>
            <select value="answer_relevancy" aria-describedby="llm-metric-note">
              <option value="answer_relevancy">Answer relevancy</option>
            </select>
            <small id="llm-metric-note">
              This route sends no retrieved context or reference answer, so answer
              relevancy is the supported metric for this workflow.
            </small>
          </label>

          {error && <RequestError message={error} />}
          <div className="form-actions">
            <span className="form-footnote">No evaluation history is stored.</span>
            <SubmitButton loading={loading} label="Run evaluation" />
          </div>
        </form>
      </section>

      <aside className="workflow-aside">
        <div className="aside-icon" aria-hidden="true">✳</div>
        <span className="eyebrow">HOW IT WORKS</span>
        <h3>From prompt to insight</h3>
        <ol className="steps-list">
          <li><span>1</span><div><strong>Generate</strong><p>Your prompt is sent to the model through Express.</p></div></li>
          <li><span>2</span><div><strong>Evaluate</strong><p>DeepEval checks whether the answer addresses your prompt.</p></div></li>
          <li><span>3</span><div><strong>Review</strong><p>Read the score together with the evaluator's explanation.</p></div></li>
        </ol>
        <p className="aside-disclaimer">Evaluation scores are useful signals, not guarantees of correctness.</p>
      </aside>

      {response && (
        <div className="results-column">
          <EvaluationResults response={response} kind="LLM evaluation" />
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
