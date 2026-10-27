import { useMemo, useState, type FormEvent } from "react";
import { EvaluationResults } from "../components/EvaluationResults";
import { RequestError, SubmitButton } from "../components/FormFields";
import { METRIC_CATALOG } from "../components/MetricCard";
import { api } from "../services/api";
import type {
  ConversationMessage,
  ExistingOutputResponse,
  MetricMetadata,
  MetricName,
  MetricSelection,
} from "../types/evaluation";
import { METRIC_NAMES } from "../types/evaluation";

interface EvalOnlyProps {
  metadata: MetricMetadata[] | null;
}

function requirementsFor(
  metric: MetricName,
  metadata: MetricMetadata[] | null,
): string[] {
  const fromApi = metadata?.find((item) => item.name === metric)?.required_fields;
  const actual: Record<MetricName, string[]> = {
    faithfulness: ["output"],
    answer_relevancy: ["query", "output"],
    contextual_precision: ["context", "output", "expected_output"],
    contextual_recall: ["context", "output", "expected_output"],
    conversation_completeness: ["messages"],
    hallucination: ["output", "context"],
  };
  const fields = new Set(fromApi?.length ? fromApi : actual[metric]);
  if (metric === "faithfulness") fields.add("context");
  return [...fields];
}

function requiredForSelection(
  selected: MetricSelection,
  metadata: MetricMetadata[] | null,
  hasMessages: boolean,
): Set<string> {
  const names: MetricName[] =
    selected === "all"
      ? METRIC_NAMES.filter(
          (name) => name !== "conversation_completeness" || hasMessages,
        )
      : Array.isArray(selected)
        ? selected
        : [selected];
  return new Set(names.flatMap((name) => requirementsFor(name, metadata)));
}

function splitContext(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function EvalOnly({ metadata }: EvalOnlyProps) {
  const [query, setQuery] = useState("");
  const [output, setOutput] = useState("");
  const [contextText, setContextText] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [allMetrics, setAllMetrics] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricName[]>([
    "answer_relevancy",
  ]);
  const [response, setResponse] = useState<ExistingOutputResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricSelection: MetricSelection = allMetrics
    ? "all"
    : selectedMetrics.length === 1
      ? selectedMetrics[0]
      : selectedMetrics;
  const requiredFields = useMemo(
    () => requiredForSelection(metricSelection, metadata, messages.length > 0),
    [metricSelection, metadata, messages.length],
  );
  const hasConversationMetric =
    allMetrics ||
    selectedMetrics.includes("conversation_completeness");

  function toggleMetric(metric: MetricName) {
    setAllMetrics(false);
    setSelectedMetrics((current) =>
      current.includes(metric)
        ? current.filter((item) => item !== metric)
        : [...current, metric],
    );
  }

  function updateMessage(
    index: number,
    key: keyof ConversationMessage,
    value: string,
  ) {
    setMessages((current) =>
      current.map((message, messageIndex) =>
        messageIndex === index ? { ...message, [key]: value } : message,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!allMetrics && selectedMetrics.length === 0) {
      setError("Select at least one metric or choose all metrics.");
      return;
    }

    const normalizedMessages = messages
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);
    const context = splitContext(contextText);
    const values: Record<string, boolean> = {
      query: query.trim().length > 0,
      output: output.trim().length > 0,
      context: context.length > 0,
      expected_output: expectedOutput.trim().length > 0,
      messages: normalizedMessages.length > 0,
    };
    const missing = [...requiredFields].filter((field) => !values[field]);
    if (missing.length) {
      setError(
        `Complete the required ${missing.map((field) => field.replace(/_/g, " ")).join(", ")} field${missing.length === 1 ? "" : "s"} for the selected metric${allMetrics || selectedMetrics.length > 1 ? "s" : ""}.`,
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      setResponse(
        await api.evaluateExisting({
          ...(query.trim() ? { query: query.trim() } : {}),
          ...(output.trim() ? { output: output.trim() } : {}),
          ...(context.length ? { context } : {}),
          ...(expectedOutput.trim()
            ? { expected_output: expectedOutput.trim() }
            : {}),
          ...(normalizedMessages.length ? { messages: normalizedMessages } : {}),
          metric: metricSelection,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred while evaluating this output.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="form-panel">
        <div className="section-heading form-panel-heading">
          <div>
            <span className="eyebrow">EVALUATE WITHOUT GENERATION</span>
            <h2>Configure an evaluation</h2>
          </div>
          <span className="step-chip">03 / 03</span>
        </div>
        <p className="panel-description">
          Provide the fields your chosen metric needs. The backend reports the
          authoritative result for each metric; individual failures do not hide
          successful results.
        </p>

        <form className="evaluation-form eval-only-form" onSubmit={submit}>
          <fieldset className="metric-picker">
            <legend>Metrics to run</legend>
            <div className="metric-choice-grid">
              {METRIC_NAMES.map((metric) => {
                const checked = allMetrics || selectedMetrics.includes(metric);
                return (
                  <label className={`metric-choice${checked ? " metric-choice-selected" : ""}`} key={metric}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMetric(metric)}
                      disabled={loading || allMetrics}
                    />
                    <span className="custom-checkbox" aria-hidden="true">
                      {checked ? "✓" : ""}
                    </span>
                    <span>{METRIC_CATALOG[metric].title}</span>
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              className={`all-metrics-button${allMetrics ? " all-metrics-active" : ""}`}
              aria-pressed={allMetrics}
              disabled={loading}
              onClick={() => {
                setAllMetrics((current) => !current);
                setSelectedMetrics([]);
              }}
            >
              {allMetrics ? "All metrics selected · click to customize" : "Select all metrics"}
            </button>
            <small>
              “All” is handled by the evaluator. It skips conversation completeness if
              you do not provide messages.
            </small>
          </fieldset>

          <div className="info-banner compact-banner" role="status">
            {requiredFields.size
              ? <>Required for this selection: <strong>{[...requiredFields].map((field) => field.replace(/_/g, " ")).join(", ")}</strong>.</>
              : "Choose at least one metric to see its required inputs."}
            {requiredFields.has("context") && metricSelection !== "all" && (
              <> For faithfulness, context is recommended in the API metadata; this form
                asks for it so the grounding evaluation has source material.</>
            )}
          </div>

          <div className="form-row">
            <label className="field">
              <span>Query {requiredFields.has("query") && <em>Required</em>}</span>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={4}
                placeholder="The question the answer should address"
                aria-required={requiredFields.has("query")}
              />
              <small>Required by answer relevancy. Optional for other metrics.</small>
            </label>
            <label className="field">
              <span>Expected output {requiredFields.has("expected_output") && <em>Required</em>}</span>
              <textarea
                value={expectedOutput}
                onChange={(event) => setExpectedOutput(event.target.value)}
                rows={4}
                placeholder="Reference answer for contextual precision or recall"
                aria-required={requiredFields.has("expected_output")}
              />
              <small>Required by contextual precision and contextual recall.</small>
            </label>
          </div>

          <label className="field">
            <span>Existing output {requiredFields.has("output") && <em>Required</em>}</span>
            <textarea
              value={output}
              onChange={(event) => setOutput(event.target.value)}
              rows={6}
              placeholder="Paste the model response you want to evaluate"
              aria-required={requiredFields.has("output")}
            />
            <small>
              Ordinary metrics need an output. For conversation completeness alone,
              the backend can supply a placeholder output.
            </small>
          </label>

          <label className="field">
            <span>Context {requiredFields.has("context") && <em>Required</em>}</span>
            <textarea
              value={contextText}
              onChange={(event) => setContextText(event.target.value)}
              rows={5}
              placeholder="Paste source passages; separate passages with a blank line"
              aria-required={requiredFields.has("context")}
            />
            <small>
              Required by hallucination and contextual metrics. Separate passages with
              a blank line to send them as a list.
            </small>
          </label>

          {hasConversationMetric && (
            <fieldset className="messages-editor">
              <legend>Conversation messages {requiredFields.has("messages") && <em>Required</em>}</legend>
              <p className="field-hint">
                Add each turn in order. The API accepts an array of messages with
                <code> role </code> and <code> content </code> fields.
              </p>
              {messages.length === 0 && (
                <p className="empty-message">No messages added yet.</p>
              )}
              {messages.map((message, index) => (
                <div className="message-row" key={index}>
                  <label className="field field-select message-role">
                    <span>Turn {index + 1} role</span>
                    <select
                      value={message.role}
                      onChange={(event) => updateMessage(index, "role", event.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </label>
                  <label className="field message-content">
                    <span>Content</span>
                    <textarea
                      value={message.content}
                      onChange={(event) => updateMessage(index, "content", event.target.value)}
                      rows={2}
                      placeholder="Write this turn's content"
                    />
                  </label>
                  <button
                    type="button"
                    className="remove-button"
                    aria-label={`Remove turn ${index + 1}`}
                    onClick={() =>
                      setMessages((current) =>
                        current.filter((_, messageIndex) => messageIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="subtle-button add-message-button"
                onClick={() =>
                  setMessages((current) => [...current, { role: "user", content: "" }])
                }
              >
                + Add message
              </button>
            </fieldset>
          )}

          {error && <RequestError message={error} />}
          <div className="form-actions">
            <span className="form-footnote">Your inputs remain in the form if a request fails.</span>
            <SubmitButton loading={loading} label="Evaluate output" />
          </div>
        </form>
      </section>

      {response && (
        <EvaluationResults response={response} kind="Existing output evaluation" />
      )}
    </div>
  );
}
