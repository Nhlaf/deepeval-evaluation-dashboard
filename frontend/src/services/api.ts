import type {
  ExistingOutputRequest,
  ExistingOutputResponse,
  HealthResponse,
  LlmEvaluationRequest,
  LlmEvaluationResponse,
  MetricsResponse,
  RagEvaluationRequest,
  RagEvaluationResponse,
} from "../types/evaluation";

const CONFIGURED_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");
const API_BASE_URL = import.meta.env.DEV ? "" : CONFIGURED_API_BASE_URL;

export class ApiError extends Error {
  readonly status?: number;
  readonly detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("The request timed out. Please try again.");
      }
      throw new ApiError(
        `Could not reach the Express API at ${CONFIGURED_API_BASE_URL}. Check that the backend is running and try again.`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ApiError(
        response.ok
          ? "The API returned a response that was not valid JSON."
          : `The API request failed with HTTP ${response.status} and did not return a JSON error.`,
        response.status,
      );
    }

    if (!response.ok) {
      const payload =
        body && typeof body === "object"
          ? (body as { error?: unknown; detail?: unknown })
          : undefined;
      const message =
        (typeof payload?.detail === "string" && payload.detail) ||
        (typeof payload?.error === "string" && payload.error) ||
        `The API request failed with HTTP ${response.status}.`;
      throw new ApiError(message, response.status, body);
    }

    return body as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function postJson<TRequest, TResponse>(
  path: string,
  payload: TRequest,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const api = {
  baseUrl: API_BASE_URL,

  health(): Promise<HealthResponse> {
    return requestJson<HealthResponse>("/api/health");
  },

  metrics(): Promise<MetricsResponse> {
    return requestJson<MetricsResponse>("/api/metrics");
  },

  evaluateLlm(
    payload: LlmEvaluationRequest,
  ): Promise<LlmEvaluationResponse> {
    return postJson("/api/llm/eval", payload);
  },

  evaluateRag(
    payload: RagEvaluationRequest,
  ): Promise<RagEvaluationResponse> {
    return postJson("/api/rag/eval", payload);
  },

  evaluateExisting(
    payload: ExistingOutputRequest,
  ): Promise<ExistingOutputResponse> {
    return postJson("/api/eval-only", payload);
  },
};
