# DeepEval Evaluation Dashboard

A web dashboard for evaluating LLM responses with [DeepEval](https://github.com/confident-ai/deepeval). Try three workflows: generate and evaluate an LLM answer, evaluate an answer against retrieved context, or score an existing answer without generating a new one.

The app has a React + TypeScript frontend, an Express + TypeScript API, and a Python FastAPI evaluation service. The browser talks to Express; Express coordinates model calls and forwards evaluations to the Python service.

## Features

- **LLM evaluation:** generate an answer and evaluate its relevance to the prompt.
- **RAG evaluation:** generate an answer using retrieved demo context and evaluate faithfulness.
- **Existing-output evaluation:** evaluate supplied answers with one or more metrics, without generating a response.
- **Metric guidance and results:** view scores, explanations, metric-specific errors, and live service status.
- **Supported metrics:** faithfulness, answer relevancy, contextual precision, contextual recall, conversation completeness, and hallucination.

Scores are evaluation signals, not guarantees of correctness. Hallucination scores are better when lower; the other listed metrics are generally better when higher.

## Requirements

- Node.js and npm
- Python 3.13 (the version used by this project's setup notes)
- A Groq API key for the default model and DeepEval judge, or an OpenAI API key with a compatible model

## Run locally

### 1. Configure the API

From the repository root, install the Node dependencies and create a local environment file:

```powershell
npm install
Copy-Item .env.example .env
```

Add your provider key to `.env`. By default, the project uses the Groq model `llama-3.3-70b-versatile`; set `GROQ_API_KEY` to use it. For OpenAI, set `OPENAI_API_KEY` and choose a compatible `EVAL_MODEL` beginning with `gpt-`.

Install the Python dependencies:

```powershell
py -3.13 -m pip install -r requirements.txt
```

### 2. Start the Python evaluator

In a terminal at the repository root:

```powershell
py -3.13 -m uvicorn deepeval_server:app --reload --host 127.0.0.1 --port 8000
```

The evaluator's interactive API documentation is available at `http://localhost:8000/docs`.

### 3. Start the Express API

In a second terminal at the repository root:

```powershell
npm run dev
```

The API listens on `http://localhost:3000` by default. It forwards evaluations to `http://localhost:8000/eval`; change `DEEPEVAL_URL` in `.env` if the evaluator uses a different address.

### 4. Start the dashboard

In a third terminal:

```powershell
Set-Location frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). During development, Vite proxies `/api` requests to the Express API at `http://localhost:3000`.

## Configuration

The root `.env.example` documents the backend settings:

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Express API port | `3000` |
| `GROQ_API_KEY` | Groq model and evaluator credential | — |
| `OPENAI_API_KEY` | OpenAI model and evaluator credential | — |
| `DEEPEVAL_URL` | Python evaluator `/eval` endpoint | `http://localhost:8000/eval` |
| `EVAL_MODEL` | Model used by DeepEval as its judge | `llama-3.3-70b-versatile` |

The frontend's `VITE_API_BASE_URL` is documented in [frontend/.env.example](frontend/.env.example). Keep credentials in the backend environment; do not put API keys in frontend configuration.

## Development checks

Build the Express API:

```powershell
npm run build
```

Type-check and build the frontend:

```powershell
Set-Location frontend
npm run typecheck
npm run build
```

## API overview

The Express API is mounted at `/api`:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/llm/eval` | Generate an LLM answer and evaluate it |
| `POST` | `/api/rag/eval` | Generate an answer using demo context and evaluate it |
| `POST` | `/api/eval-only` | Evaluate a supplied answer and optional context or messages |
| `GET` | `/api/health` | Check API health |
| `GET` | `/api/metrics` | Retrieve metric metadata |

The Python evaluator also exposes `/eval`, `/health`, `/example`, and `/metrics-info`.

## Current limitations

- RAG retrieval is a demo implementation using keyword matching and hard-coded text; it is not a vector search or production retrieval system.
- Evaluations are run synchronously, and results are not persisted.
- The services do not provide application authentication. Add suitable access controls and deployment configuration before exposing them publicly.

See [BACKEND.md](BACKEND.md) and [FRONTEND.md](FRONTEND.md) for implementation details, request requirements, and workflow documentation. Frontend-specific setup is also available in [frontend/README.md](frontend/README.md).
