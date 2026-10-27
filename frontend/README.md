# DeepEval dashboard frontend

This is a standalone React, TypeScript, and Vite frontend. It sends requests only to
the existing Express API; it does not call an LLM provider or the Python evaluator
directly.

## Run locally

From this directory, install the frontend dependencies:

```powershell
npm install
```

Copy `.env.example` to `.env` and keep the Express URL as the API base:

```powershell
Copy-Item .env.example .env
```

Start the Vite development server:

```powershell
npm run dev
```

The frontend is available at `http://localhost:5173`. Vite forwards `/api` requests
to `VITE_API_BASE_URL` (default `http://localhost:3000`), avoiding browser
cross-origin requests during development. Start the Python evaluator and Express
backend separately before running evaluations.

To verify types and build static assets:

```powershell
npm run typecheck
npm run build
```

For a separately hosted production frontend, configure `VITE_API_BASE_URL` at build
time and route API requests through a same-origin reverse proxy or configure the
Express deployment for the required browser origin. The current Express app does
not include CORS middleware.
