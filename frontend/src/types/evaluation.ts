export const METRIC_NAMES = [
  "faithfulness",
  "answer_relevancy",
  "contextual_precision",
  "contextual_recall",
  "conversation_completeness",
  "hallucination",
] as const;

export type MetricName = (typeof METRIC_NAMES)[number];
export type MetricSelection = MetricName | MetricName[] | "all";

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface MetricResult {
  metric_name: string;
  score?: number | null;
  explanation?: string | null;
  error?: string | null;
}

export interface Evaluation {
  metric?: string | null;
  score?: number | null;
  explanation?: string | null;
  error?: string | null;
  results?: MetricResult[];
}

export interface LlmEvaluationRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  metric?: string;
}

export interface LlmEvaluationResponse {
  prompt: string;
  model: string;
  temperature: number;
  provider: string;
  llmResponse: string;
  evaluation: Evaluation;
}

export interface RagEvaluationRequest {
  query: string;
  model?: string;
  temperature?: number;
  metric?: string;
}

export interface RagEvaluationResponse {
  query: string;
  context?: string;
  prompt?: string;
  model: string;
  temperature: number;
  provider: string;
  llmResponse: string;
  evaluation: Evaluation;
}

export interface ExistingOutputRequest {
  query?: string;
  output?: string;
  context?: string[];
  expected_output?: string;
  messages?: ConversationMessage[];
  metric: MetricSelection;
}

export interface ExistingOutputResponse {
  query?: string;
  output?: string;
  context?: string[];
  expected_output?: string;
  messages?: ConversationMessage[];
  evaluation: Evaluation;
}

export interface HealthResponse {
  status: string;
  timestamp?: string;
}

export interface MetricMetadata {
  name: string;
  description?: string;
  endpoint?: string;
  parameter?: string;
  range?: string;
  higher_is_better?: boolean;
  required_fields?: string[];
  recommended_fields?: string[];
  optional_fields?: string[];
}

export interface MetricsResponse {
  available_metrics?: Array<MetricMetadata | string>;
  usage?: string;
  multi_metric_support?: Record<string, string>;
  training_note?: string;
  usage_examples?: Record<string, unknown>;
  request_structure?: Record<string, string>;
  error?: string;
}

export interface ApiFailureBody {
  error?: string;
  detail?: string;
  status?: number;
  available_metrics?: string[];
}
