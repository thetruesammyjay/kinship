import { Activity, Gauge, Star } from "lucide-react";

export function AdminEvaluation() {
  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">chapter 4 metrics</span>
        <h1>Evaluation dashboard</h1>
      </section>
      <section className="metric-grid">
        <article className="metric-card">
          <Activity size={24} />
          <strong>0.0</strong>
          <span>accuracy baseline</span>
        </article>
        <article className="metric-card pink">
          <Gauge size={24} />
          <strong>0ms</strong>
          <span>avg response time</span>
        </article>
        <article className="metric-card dark">
          <Star size={24} />
          <strong>SUS</strong>
          <span>survey pending</span>
        </article>
      </section>
    </div>
  );
}
