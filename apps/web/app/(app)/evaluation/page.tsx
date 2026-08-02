"use client";

import { Activity, Gauge, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AccuracySummary, PerformanceSummary, SusSummary } from "@/lib/types";

export default function EvaluationPage() {
  const [accuracy, setAccuracy] = useState<AccuracySummary | null>(null);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [sus, setSus] = useState<SusSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, p, s] = await Promise.all([
          apiRequest<AccuracySummary>("/evaluation/accuracy"),
          apiRequest<PerformanceSummary>("/evaluation/performance"),
          apiRequest<SusSummary>("/evaluation/sus/summary"),
        ]);
        if (cancelled) return;
        setAccuracy(a);
        setPerformance(p);
        setSus(s);
      } catch {
        if (!cancelled) setError("Could not load evaluation metrics. Is the API running?");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">chapter 4 metrics</span>
        <h1>Evaluation dashboard</h1>
      </section>
      {error && <p className="form-error">{error}</p>}
      <section className="metric-grid">
        <article className="metric-card">
          <Activity size={24} />
          <strong>{accuracy ? `${(accuracy.accuracy * 100).toFixed(1)}%` : "—"}</strong>
          <span>
            accuracy ({accuracy?.correct_detections ?? 0}/{accuracy?.total_tests ?? 0} tests)
          </span>
        </article>
        <article className="metric-card pink">
          <Gauge size={24} />
          <strong>{performance ? `${performance.average_ms.toFixed(0)}ms` : "—"}</strong>
          <span>avg response time ({performance?.samples ?? 0} samples)</span>
        </article>
        <article className="metric-card dark">
          <Star size={24} />
          <strong>{sus ? sus.average_score.toFixed(1) : "—"}</strong>
          <span>SUS · {sus?.interpretation.replaceAll("_", " ") ?? "pending"}</span>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <span className="eyebrow">how metrics accrue</span>
          <h2>Evaluation framework</h2>
        </div>
        <p className="muted-copy">
          Accuracy compares verdicts against expert-validated pairs, response time is sampled from
          each verification request, and SUS scores come from the 10-item usability survey. All
          three feed the evaluation chapter directly.
        </p>
      </section>
    </div>
  );
}
