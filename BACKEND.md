# Backend implementation

## Overview

The backend is a small two-process application:

1. **Express + TypeScript** provides the public API, optionally generates an answer with an LLM, retrieves demo context for RAG requests, and forwards evaluation requests.
2. **FastAPI + Python** is a sidecar service that builds DeepEval test cases, runs one or more metrics, and returns scores and explanations.

The Node service listens on port `3000` by default. The evaluator listens on port `8000` by default. They communicate over HTTP; the configured `DEEPEVAL_URL` points to the Python service's `/eval` endpoint.

There is no database or persistent application state. The RAG service currently uses hard-coded example text and keyword matching rather than a vector store or document database.

## Backend layout

| Path | Responsibility |
| --- | --- |
| `src/index.ts` | Creates the Express app, configures request parsing and logging, mounts routes, handles 404s and errors, and starts the Node server. |
| `src/config/env.ts` | Loads Node environment variables and supplies defaults for the port, API keys, and evaluator URL. |
| `src/routes/evalRoutes.ts` | Implements the public API endpoints and coordinates LLM generation, retrieval, and evaluation. |
| `src/services/llmClient.ts` | Calls OpenAI or Groq chat-completions APIs based on the requested model name. |
| `src/services/ragService.ts` | Supplies demo context using simple keyword matching. |
| `src/services/evalClient.ts` | Sends evaluation payloads to the Python service and adapts errors and results. |
| `deepeval_server.py` | Defines the FastAPI sidecar, request/response models, provider wrapper, metric validation and execution, and metadata and health endpoints. |
| `requirements.txt` | Pins the Python service's FastAPI, Uvicorn, Pydantic, dotenv, and DeepEval dependencies. |
| `package.json` | Defines the Node development, build, and start scripts and TypeScript/Express dependencies. |

## Request flows

### LLM-only evaluation

`POST /api/llm/eval` validates a prompt and optional temperature, chooses a model (default `llama-3.3-70b-versatile`), and calls the corresponding LLM provider. It then sends the prompt as the evaluation query and the generated response as output to the evaluator. The default metric is `answer_relevancy`.

### RAG evaluation

`POST /api/rag/eval` validates a query and optional temperature, retrieves one mock context string, and asks the LLM to answer using only that context. It sends the context and generated answer to the evaluator. The default metric is `faithfulness`.

The current retrieval implementation checks for terms such as `resume`, `experience`, `company`, `about`, `product`, and `feature`, and returns one of three hard-coded passages. Other queries receive a generic placeholder context. Replace `src/services/ragService.ts` with a real retrieval integration before using this as a production RAG system.

### Evaluation of existing output

`POST /api/eval-only` accepts an existing query/output pair and optional context, reference answer, messages, and metric. It does not call an LLM to generate output. The default metric is `answer_relevancy`. For `conversation_completeness`, provide `messages`; the route supplies a placeholder output if one is omitted.

### Evaluation sidecar

The Node evaluation client posts to `DEEPEVAL_URL` (default `http://localhost:8000/eval`). FastAPI validates the requested metrics and required fields, initializes its evaluator using the Python process environment, constructs either a DeepEval `LLMTestCase` or `ConversationalTestCase`, and runs the corresponding DeepEval metric.

The sidecar can evaluate one metric, an array of metrics, or `"all"`. Each metric result contains its name and either a score and explanation or an error. The response also fills legacy top-level metric fields from the first successful result when available.

## HTTP API

The Express routes are mounted beneath `/api`.

| Method and path | Purpose | Main request fields |
| --- | --- | --- |
| `POST /api/llm/eval` | Generate a model response and evaluate it. | `prompt` (required), `model`, `temperature`, `metric` |
| `POST /api/rag/eval` | Retrieve demo context, generate a grounded answer, and evaluate it. | `query` (required), `model`, `temperature`, `metric` |
| `POST /api/eval-only` | Evaluate a supplied response without generation. | `output` (usually required), `query`, `context`, `expected_output`, `messages`, `metric` |
| `GET /api/health` | Return a Node service status and timestamp. | — |
| `GET /api/metrics` | Fetch evaluator metric metadata and add brief usage descriptions. | — |

The FastAPI sidecar exposes:

| Method and path | Purpose |
| --- | --- |
| `POST /eval` | Run one or more requested metrics. |
| `GET /health` | Return sidecar status and version. |
| `GET /example` | Run a fixed faithfulness smoke test; this requires working evaluator credentials and provider access. |
| `GET /metrics-info` | List metrics, their input requirements, score direction, and example payloads. |

Unknown Express routes return a JSON 404 response. Express errors are logged and returned as JSON with an HTTP status. The sidecar rejects missing `output` fields for ordinary metrics and missing `messages` for conversation completeness before execution. Other metric-specific requirements, such as a reference answer for contextual precision and recall, are reported as errors on the individual metric result.

## Evaluation metrics

| Metric | Required fields in the evaluator | Score direction |
| --- | --- | --- |
| `faithfulness` | `output`; `context` and `query` are recommended | Higher is better |
| `answer_relevancy` | `query`, `output` | Higher is better |
| `contextual_precision` | `context`, `output`, `expected_output` | Higher is better |
| `contextual_recall` | `context`, `output`, `expected_output` | Higher is better |
| `conversation_completeness` | `messages` | Higher is better |
| `hallucination` | `output`, `context` | Lower is better; `0` means no hallucinations |

Metric scores are generally in the `0.0` to `1.0` range. The evaluator uses synchronous DeepEval metric calls and requests explanations. In addition to DeepEval scoring, the current faithfulness implementation includes a heuristic cap for certain additive claims: if the answer says, for example, that two categories of applications are supported while the context only mentions one, a near-perfect DeepEval score may be capped at `0.75`.

## Configuration

Copy `.env.example` to `.env` and set credentials for the providers you use.

| Variable | Used by | Behavior |
| --- | --- | --- |
| `PORT` | Node | Express listen port; defaults to `3000`. |
| `GROQ_API_KEY` | Node and Python | Groq credential for Groq chat models and, by default, DeepEval judging. |
| `OPENAI_API_KEY` | Node and Python | OpenAI credential when using OpenAI models. |
| `DEEPEVAL_URL` | Node | Evaluator endpoint; defaults to `http://localhost:8000/eval`. |
| `EVAL_MODEL` | Python | DeepEval judge model; defaults to `llama-3.3-70b-versatile`. Prefixes are used to choose Groq versus OpenAI. |

The Node LLM client routes models beginning with `llama-`, `mixtral-`, `gemma`, or `qwen` to Groq; other models go to OpenAI. The Python evaluator independently selects its provider from `EVAL_MODEL`. Although the evaluation request schema contains a `provider` field, evaluator initialization currently uses the Python environment rather than that request field. Configure `EVAL_MODEL` and the matching API key in the environment of the Python process.

The LLM-only and RAG routes do not accept an `expected_output`; use `/api/eval-only` with `expected_output` when evaluating contextual precision or recall.

## Running locally

Install the JavaScript dependencies and Python requirements:

```bash
npm install
python -m pip install -r requirements.txt
```

Start the Python evaluator in one terminal:

```bash
uvicorn deepeval_server:app --reload --host 0.0.0.0 --port 8000
```

Start the Node API in another terminal:

```bash
npm run dev
```

For a TypeScript build and compiled server, run:

```bash
npm run build
npm start
```

The Python API's interactive documentation is available at `http://localhost:8000/docs` when the sidecar is running.

## Current implementation notes

- The Express app uses JSON and URL-encoded request parsing and logs each request's timestamp, method, and path.
- Temperature is checked by the LLM and RAG routes to be numeric and between `0` and `2`.
- LLM and evaluator calls are synchronous from the route's perspective; there is no job queue or persisted evaluation history.
- `src/services/ragService.ts` is explicitly a placeholder, and only returns one text passage per query.
- The Python sidecar enables permissive CORS and does not define application authentication. Do not expose either service publicly without adding appropriate access controls and deployment configuration.
- Keep `.env` credentials private; `.env` is excluded by `.gitignore`.
