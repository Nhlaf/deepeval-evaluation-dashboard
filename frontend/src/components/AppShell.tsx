import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";

export type View =
  | "dashboard"
  | "llm"
  | "rag"
  | "existing"
  | "metrics";

const NAV_ITEMS: { id: View; label: string; number: string }[] = [
  { id: "dashboard", label: "Dashboard", number: "01" },
  { id: "llm", label: "LLM evaluation", number: "02" },
  { id: "rag", label: "RAG evaluation", number: "03" },
  { id: "existing", label: "Existing output", number: "04" },
  { id: "metrics", label: "Metrics guide", number: "05" },
];

const PAGE_TITLES: Record<View, { title: string; description: string }> = {
  dashboard: {
    title: "Evaluation workspace",
    description: "A clear view of your evaluation tools and backend connection.",
  },
  llm: {
    title: "LLM evaluation",
    description: "Generate a response and evaluate how well it answers the prompt.",
  },
  rag: {
    title: "RAG evaluation",
    description: "Test an answer grounded in the backend's demonstration context.",
  },
  existing: {
    title: "Evaluate existing output",
    description: "Run one or more DeepEval metrics on a response you already have.",
  },
  metrics: {
    title: "Metrics guide",
    description: "Understand what each metric checks, the inputs it needs, and its score direction.",
  },
};

interface AppShellProps {
  view: View;
  onNavigate: (view: View) => void;
  apiState: "checking" | "online" | "offline";
  evaluatorState: "checking" | "online" | "offline";
  children: ReactNode;
}

export function AppShell({
  view,
  onNavigate,
  apiState,
  evaluatorState,
  children,
}: AppShellProps) {
  const page = PAGE_TITLES[view];

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Main navigation">
        <button
          className="brand"
          type="button"
          onClick={() => onNavigate("dashboard")}
          aria-label="DeepEval dashboard home"
        >
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-copy">
            <strong>DeepEval</strong>
            <span>QUALITY WORKSPACE</span>
          </span>
        </button>

        <div className="nav-caption">WORKSPACE</div>
        <nav className="primary-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-link${view === item.id ? " nav-link-active" : ""}`}
              type="button"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-number">{item.number}</span>
              <span>{item.label}</span>
              {view === item.id && <span className="nav-indicator" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="note-icon" aria-hidden="true">i</span>
          <p>Evaluations run through your local Express API. No results are stored.</p>
        </div>
        <div className="sidebar-footer">DeepEval · Local workspace</div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb" aria-label="Breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{page.title}</strong>
          </div>
          <div className="connection-status" aria-label="Backend connection status">
            <StatusBadge
              state={apiState}
              label={`Express API ${apiState === "online" ? "online" : apiState === "offline" ? "offline" : "checking"}`}
            />
            <StatusBadge
              state={evaluatorState}
              label={`Evaluator ${evaluatorState === "online" ? "reachable" : evaluatorState === "offline" ? "unavailable" : "checking"}`}
            />
          </div>
        </header>

        <main className="main-content">
          <div className="page-intro">
            <div>
              <span className="eyebrow">DEEPEVAL / QUALITY ASSURANCE</span>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
            </div>
            <span className="environment-chip">
              <span className="environment-dot" aria-hidden="true" />
              Local environment
            </span>
          </div>
          {children}
          <footer className="page-footer">
            <span>Evaluation scores are signals, not guarantees of correctness.</span>
            <span>Powered by your configured DeepEval backend</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
