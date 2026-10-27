import { MetricCard, metadataFor } from "../components/MetricCard";
import type { MetricMetadata, MetricName } from "../types/evaluation";
import { METRIC_NAMES } from "../types/evaluation";

interface MetricsGuideProps {
  metadata: MetricMetadata[] | null;
  metadataError: string | null;
}

export function MetricsGuide({ metadata, metadataError }: MetricsGuideProps) {
  return (
    <div className="page-stack">
      {metadataError ? (
        <div className="info-banner" role="status">
          Live metric metadata is unavailable. The descriptions below reflect the six
          metrics in the checked-in evaluator implementation; live availability has
          not been verified during this session.
        </div>
      ) : (
        <div className="info-banner" role="status">
          {metadata
            ? "Availability labels reflect the latest successful response from GET /api/metrics."
            : "Loading metric availability from GET /api/metrics…"}
        </div>
      )}
      <div className="guide-intro">
        <div className="guide-intro-icon" aria-hidden="true">◎</div>
        <div>
          <h2>What does a score mean?</h2>
          <p>
            Scores are generally between 0.0 and 1.0. Most metrics are better when
            higher; hallucination is better when lower. Always read the explanation
            and consider the input quality. No score guarantees that an answer is
            correct.
          </p>
        </div>
      </div>
      <section className="metric-guide-grid" aria-label="Evaluation metric definitions">
        {METRIC_NAMES.map((name: MetricName) => {
          const live = metadataFor(name, metadata);
          const liveReported = metadata !== null && Boolean(live);
          return (
            <article className="guide-metric" key={name}>
              <div className="guide-metric-status">
                <span className={`availability ${liveReported ? "availability-live" : metadata ? "availability-not-reported" : "availability-unknown"}`}>
                  <span aria-hidden="true">●</span>
                  {liveReported
                    ? "Reported by backend"
                    : metadata
                      ? "Not reported by backend"
                      : "Live status unknown"}
                </span>
              </div>
              <MetricCard name={name} metadata={live} />
              <p className="guide-detail">
                Input requirements come from the backend's <code>/api/metrics</code>
                metadata when available. Required inputs are validated again by the
                evaluator; metric-level validation errors are shown with the result.
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
