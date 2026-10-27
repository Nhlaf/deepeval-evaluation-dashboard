# Frontend Implementation

## 1. Overview

The frontend is a responsive web application for interacting with the existing DeepEval evaluation backend. It provides a user-friendly interface for generating AI responses, testing Retrieval-Augmented Generation (RAG), evaluating existing outputs, and viewing evaluation scores and explanations.

The application communicates with the Express + TypeScript API running on port `3000`. The Express API coordinates LLM generation, demo context retrieval, and evaluation through the FastAPI + Python DeepEval service running on port `8000`.

The frontend does not execute DeepEval metrics, call LLM providers directly, retrieve documents independently, or connect to a database. All these responsibilities remain within the existing backend.

### Technology stack

- React for the user interface.
- TypeScript for type safety.
- Vite for development and production builds.
- CSS for styling and responsive layouts.
- Fetch API for communicating with the Express backend.

The frontend should use the existing backend API as its single source of truth.

## 2. Frontend objectives

The application must allow users to:

1. Generate an LLM response and evaluate its answer relevancy.
2. Generate a RAG response using the backend's retrieved demo context and evaluate its faithfulness.
3. Evaluate an existing query and output without generating a new LLM response.
4. Select one or more supported DeepEval metrics.
5. View metric scores, explanations, and individual metric errors.
6. Understand which metrics require reference answers, contexts, or conversation messages.
7. Check backend and evaluator service health.
8. View available metric information and their input requirements.

The interface should make it easy for beginners to understand what is being tested, which inputs are required, and what the resulting scores mean.

## 3. Frontend layout

The application should use a dashboard layout with the following sections.

### 3.1 Header

Display:

- Application name: DeepEval Evaluation Dashboard.
- A short description: Evaluate LLM responses and RAG answer quality.
- Node API connection status.
- Evaluator service status when available through the existing backend health or metadata endpoints.

The connection indicators must reflect actual API responses. Do not display a service as online merely because the frontend has loaded.

### 3.2 Navigation

Provide navigation for the following pages or views:

- Dashboard
- LLM Evaluation
- RAG Evaluation
- Evaluate Existing Output
- Metrics Guide

Use a consistent layout and highlight the active section.

### 3.3 Dashboard overview

The dashboard should introduce the three evaluation workflows and provide quick access to each.

Include metric summary cards for:

- Faithfulness
- Answer Relevancy
- Contextual Precision
- Contextual Recall
- Conversation Completeness
- Hallucination

Each card should explain the purpose of the metric and its score direction. These cards are informational and must not display fabricated scores or historical statistics.

The dashboard should also show the current backend connection status and provide a link to the evaluation forms.

## 4. Evaluation workflows

### 4.1 LLM Evaluation

Purpose: Generate a response using an LLM and evaluate how relevant the answer is to the user's prompt.

Endpoint:

`POST /api/llm/eval`

Form fields:

- Prompt — required.
- Model — optional; use `llama-3.3-70b-versatile` as the default.
- Temperature — optional; default to a reasonable value such as `0.7`, allowing values from `0` to `2`.
- Metric — optional; default to `answer_relevancy`.

The form should validate required inputs before submitting.

On submission:

1. Send the form data to the Express API.
2. Display a loading indicator.
3. Display the generated answer when returned.
4. Display the evaluation score and explanation.
5. Display meaningful errors if generation or evaluation fails.

The frontend must not call OpenAI or Groq directly.

### 4.2 RAG Evaluation

Purpose: Generate an answer using retrieved context and evaluate whether the response is supported by that context.

Endpoint:

`POST /api/rag/eval`

Form fields:

- Query — required.
- Model — optional; default to `llama-3.3-70b-versatile`.
- Temperature — optional; default to `0.7`, with a permitted range of `0` to `2`.
- Metric — optional; default to `faithfulness`.

On submission:

1. Send the query and selected options to the backend.
2. Display the retrieved context returned by the backend, if included in the response.
3. Display the generated answer.
4. Display the selected metric's score and explanation.
5. Explain whether the score indicates that the answer is supported by the available context.
6. Display any backend errors without losing the user's input.

The frontend must not implement its own retrieval logic. The backend currently uses hard-coded example passages and keyword matching rather than a vector database.

### 4.3 Evaluate Existing Output

Purpose: Evaluate an existing AI response without generating a new response.

Endpoint:

`POST /api/eval-only`

Form fields:

- Query — required when needed by the selected metric.
- Output — required for ordinary metrics.
- Context — optional generally, but required for context-dependent metrics.
- Expected Output — required for contextual precision and contextual recall.
- Messages — required for conversation completeness.
- Metric — required or optional according to the backend API contract; use `answer_relevancy` as the default if appropriate.

The interface must support evaluating one metric, multiple metrics, or all available metrics when supported by the existing API.

The form should dynamically indicate which fields are required for the selected metric or metrics. For example:

- Faithfulness requires an output and context.
- Answer relevancy requires a query and output.
- Contextual precision requires context, output, and expected output.
- Contextual recall requires context, output, and expected output.
- Conversation completeness requires messages.
- Hallucination requires output and context.

The backend remains responsible for final validation. The frontend should also display any metric-specific errors returned by the evaluator.

For conversation completeness, provide a structured message editor that supports adding and removing messages with a role and content. Serialize the messages in the format expected by the existing API.

## 5. Metrics Guide

Create a dedicated section that explains the six supported metrics in simple language.

| Metric | What it evaluates | Score direction |
|---|---|---|
| Faithfulness | Whether the answer is supported by the supplied context. | Higher is better |
| Answer Relevancy | Whether the answer addresses the user's question. | Higher is better |
| Contextual Precision | Whether relevant information appears in the context in a useful order for answering the question. | Higher is better |
| Contextual Recall | Whether the context contains the information needed to support the expected answer. | Higher is better |
| Conversation Completeness | Whether a conversation adequately covers the required information or objectives. | Higher is better |
| Hallucination | Whether the answer contains claims that are unsupported by or inconsistent with the supplied context, according to the evaluator. | Lower is better |

Explain that scores are generally between `0.0` and `1.0`, but should be interpreted in the context of the metric and its explanation.

A score is an evaluation signal, not a guarantee that an answer is correct. Display the evaluator's explanation alongside the score whenever available.

Use the existing `GET /api/metrics` endpoint to retrieve metric metadata when possible. Do not invent metric definitions or assume that every metric is available if the backend reports otherwise.

## 6. Results presentation

Create a reusable evaluation results component.

For each evaluation, display:

- Evaluation type.
- Original prompt or query.
- Generated or supplied output.
- Retrieved context, if applicable and returned.
- Expected output, if supplied.
- Metric name.
- Score.
- Metric explanation.
- Individual metric errors.
- Overall request status.

When multiple metrics are evaluated, show each result separately using cards or a table.

Use a clear score presentation, such as a progress bar or score indicator, and label the score direction. Do not use the same interpretation for hallucination as for metrics where higher scores are better.

If the backend returns a failed metric alongside successful metrics, display both outcomes. Do not discard successful results because another metric failed.

Do not fabricate evaluation history, aggregate statistics, or scores. The backend does not persist evaluation history.

## 7. API integration

Configure a single API base URL using a Vite environment variable:

`VITE_API_BASE_URL=http://localhost:3000`

Create a central API service module responsible for HTTP requests.

The frontend should integrate with these existing Express endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/llm/eval` | Generate and evaluate an LLM response. |
| POST | `/api/rag/eval` | Generate and evaluate a context-grounded response. |
| POST | `/api/eval-only` | Evaluate an existing response. |
| GET | `/api/health` | Check the Node API health. |
| GET | `/api/metrics` | Retrieve available metric metadata and descriptions. |

The Python endpoints `/eval`, `/health`, `/example`, and `/metrics-info` belong to the evaluator sidecar. The browser should not call these directly unless a future backend change explicitly requires it.

All request and response TypeScript types should reflect the actual backend implementation. Inspect the route handlers, validation schemas, and response objects before implementing the forms or results components.

Do not assume that all endpoints return identical response structures. Adapt each response through the central API service.

Handle network failures, non-success HTTP responses, invalid JSON responses, timeouts where appropriate, and metric-level errors.

## 8. UI states and error handling

Every evaluation form must support:

- Idle state.
- Form validation errors.
- Loading state.
- Successful evaluation.
- Partial metric failure.
- Complete evaluation failure.
- Backend unavailable state.

Disable duplicate submissions while a request is in progress.

Show clear messages when:

- The Node API cannot be reached.
- The evaluator is unavailable.
- An API key or provider configuration is missing.
- A selected metric requires additional inputs.
- The backend returns an error for an individual metric.

Preserve entered form values when a request fails so users can correct their inputs without starting again.

Never expose API keys or environment variables in the frontend.

## 9. Design requirements

Use a professional, modern dashboard style suitable for an AI engineering portfolio.

The interface should have:

- A clean, responsive layout.
- A consistent color palette and typography.
- Clear section headings.
- Readable forms and labels.
- Appropriate spacing and accessible contrast.
- Reusable buttons, inputs, cards, badges, and result components.
- Responsive navigation for desktop and mobile.
- Visible focus states and keyboard accessibility.
- Clear loading indicators and error messages.

Prefer simple charts or progress indicators only where they improve score interpretation. Do not add unnecessary animations, decorative charts, or mock data.

## 10. Suggested frontend structure

Adapt this structure to the existing repository instead of overwriting working files.

`frontend/`

- `src/`
  - `components/`
    - `layout/`
    - `forms/`
    - `results/`
    - `metrics/`
    - `common/`
  - `pages/`
    - `Dashboard.tsx`
    - `LlmEvaluation.tsx`
    - `RagEvaluation.tsx`
    - `EvalOnly.tsx`
    - `MetricsGuide.tsx`
  - `services/`
    - `api.ts`
  - `types/`
    - `evaluation.ts`
  - `utils/`
    - `validation.ts`
  - `App.tsx`
  - `main.tsx`
  - `styles/`
    - `global.css`
- `.env.example`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`

Use a routing library only if it adds value to the navigation. Otherwise, a simple view-based implementation is sufficient.

## 11. Running the frontend locally

Install frontend dependencies from the frontend directory:

`npm install`

Create a `.env` file containing:

`VITE_API_BASE_URL=http://localhost:3000`

Start the frontend development server:

`npm run dev`

The frontend should display its local development URL.

Before using the application, start the Python evaluator on port `8000` and the Express backend on port `3000`, following the instructions in `backend.md`.

The frontend must not attempt to start or manage these backend processes automatically.

## 12. Testing and acceptance criteria

The implementation is complete when:

1. The frontend starts without TypeScript or build errors.
2. All three evaluation workflows submit requests to the correct endpoints.
3. The selected model, temperature, and metrics are passed according to the API contract.
4. Metric-specific input requirements are explained and validated.
5. Generated answers and evaluation explanations are displayed correctly.
6. Multiple metric results and partial failures are handled.
7. Backend connection errors are displayed clearly.
8. Metric metadata is loaded from the backend when available.
9. The layout works on desktop and mobile.
10. No API keys are exposed in client-side code.
11. No evaluation results, historical data, or backend capabilities are fabricated.
12. The existing backend implementation remains unchanged.

## 13. Implementation constraints

- Inspect the existing repository before making changes.
- Reuse the backend API and its existing response formats.
- Do not rewrite backend services or change endpoint contracts just to accommodate the frontend.
- Do not introduce a database, authentication system, vector store, or unrelated functionality.
- Keep the frontend code modular, readable, and beginner-friendly.
- Document any assumptions where the existing backend contract is unclear.
- Prioritize a working end-to-end implementation over unnecessary features.