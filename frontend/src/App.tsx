import { useCallback, useEffect, useState } from "react";
import { AppShell, type View } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { EvalOnly } from "./pages/EvalOnly";
import { LlmEvaluation } from "./pages/LlmEvaluation";
import { MetricsGuide } from "./pages/MetricsGuide";
import { RagEvaluation } from "./pages/RagEvaluation";
import { api } from "./services/api";
import type { MetricMetadata } from "./types/evaluation";

type ConnectionState = "checking" | "online" | "offline";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [apiState, setApiState] = useState<ConnectionState>("checking");
  const [evaluatorState, setEvaluatorState] = useState<ConnectionState>("checking");
  const [metadata, setMetadata] = useState<MetricMetadata[] | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setApiState("checking");
    setEvaluatorState("checking");
    const [healthResult, metricsResult] = await Promise.allSettled([
      api.health(),
      api.metrics(),
    ]);

    if (
      healthResult.status === "fulfilled" &&
      healthResult.value.status.toLowerCase() === "ok"
    ) {
      setApiState("online");
    } else {
      setApiState("offline");
    }

    if (metricsResult.status === "fulfilled") {
      const response = metricsResult.value;
      const metricData = response.available_metrics || [];
      const availableMetrics = metricData.filter(
        (item): item is MetricMetadata =>
          typeof item !== "string" && typeof item.name === "string",
      );
      if (availableMetrics.length > 0) {
        setMetadata(availableMetrics);
        setMetadataError(null);
        setEvaluatorState("online");
      } else {
        setMetadata(null);
        setMetadataError("The API did not return live metric metadata.");
        setEvaluatorState("offline");
      }
    } else {
      const message =
        metricsResult.reason instanceof Error
          ? metricsResult.reason.message
          : "Could not load evaluator metadata.";
      setMetadata(null);
      setMetadataError(message);
      setEvaluatorState("offline");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 30_000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  let content;
  switch (view) {
    case "llm":
      content = <LlmEvaluation />;
      break;
    case "rag":
      content = <RagEvaluation />;
      break;
    case "existing":
      content = <EvalOnly metadata={metadata} />;
      break;
    case "metrics":
      content = <MetricsGuide metadata={metadata} metadataError={metadataError} />;
      break;
    default:
      content = (
        <Dashboard
          metadata={metadata}
          metadataError={metadataError}
          onNavigate={setView}
          refreshStatus={() => void refreshStatus()}
        />
      );
  }

  return (
    <AppShell
      view={view}
      onNavigate={setView}
      apiState={apiState}
      evaluatorState={evaluatorState}
    >
      {content}
    </AppShell>
  );
}
