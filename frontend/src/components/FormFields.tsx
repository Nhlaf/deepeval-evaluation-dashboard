interface ModelOptionsProps {
  model: string;
  temperature: number;
  onModelChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
}

export function ModelOptions({
  model,
  temperature,
  onModelChange,
  onTemperatureChange,
}: ModelOptionsProps) {
  return (
    <div className="form-row">
      <label className="field">
        <span>Model</span>
        <input
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          autoComplete="off"
          required
        />
        <small>Model names determine whether the API routes to Groq or OpenAI.</small>
      </label>
      <label className="field">
        <span>Temperature <strong className="field-value">{temperature.toFixed(1)}</strong></span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(event) => onTemperatureChange(Number(event.target.value))}
          aria-label={`Temperature, ${temperature.toFixed(1)}`}
        />
        <small>Choose a value from 0 to 2.</small>
      </label>
    </div>
  );
}

interface SubmitButtonProps {
  loading: boolean;
  label: string;
}

export function SubmitButton({ loading, label }: SubmitButtonProps) {
  return (
    <button className="button button-primary submit-button" type="submit" disabled={loading}>
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" /> Evaluating…
        </>
      ) : (
        <>
          {label} <span aria-hidden="true">→</span>
        </>
      )}
    </button>
  );
}

export function RequestError({ message }: { message: string }) {
  return (
    <div className="request-error" role="alert">
      <span className="error-icon" aria-hidden="true">!</span>
      <div>
        <strong>Request failed</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
