"use client";

import { Activity, CheckCircle2, Gauge, Send, Star } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  AccuracySummary,
  PerformanceSummary,
  SusSubmissionRead,
  SusSummary,
} from "@/lib/types";

const questions = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need technical support to use this system.",
  "I found the functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
];
const scale = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

export default function EvaluationPage() {
  const [accuracy, setAccuracy] = useState<AccuracySummary | null>(null);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [sus, setSus] = useState<SusSummary | null>(null);
  const [responses, setResponses] = useState<number[]>(Array(10).fill(0));
  const [result, setResult] = useState<SusSubmissionRead | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    const [accuracyData, performanceData, susData] = await Promise.all([
      apiRequest<AccuracySummary>("/evaluation/accuracy"),
      apiRequest<PerformanceSummary>("/evaluation/performance"),
      apiRequest<SusSummary>("/evaluation/sus/summary"),
    ]);
    setAccuracy(accuracyData);
    setPerformance(performanceData);
    setSus(susData);
  }, []);

  useEffect(() => {
    loadMetrics().catch(() => setError("Could not load evaluation metrics."));
  }, [loadMetrics]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (responses.some((response) => response === 0)) {
      setError("Please answer all 10 questions.");
      return;
    }
    setBusy(true);
    try {
      const submission = await apiRequest<SusSubmissionRead>("/evaluation/sus", {
        method: "POST",
        body: JSON.stringify({ responses }),
      });
      setResult(submission);
      await loadMetrics();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit the survey.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">system usability scale</span>
        <h1>Evaluation</h1>
      </section>
      <section className="metric-grid">
        <article className="metric-card"><Activity size={24} /><strong>{accuracy ? `${(accuracy.accuracy * 100).toFixed(1)}%` : "-"}</strong><span>verification accuracy</span></article>
        <article className="metric-card pink"><Gauge size={24} /><strong>{performance ? `${performance.average_ms.toFixed(0)}ms` : "-"}</strong><span>average response time</span></article>
        <article className="metric-card dark"><Star size={24} /><strong>{sus ? sus.average_score.toFixed(1) : "-"}</strong><span>SUS · {sus?.interpretation.replaceAll("_", " ") ?? "pending"}</span></article>
      </section>
      {result && (
        <section className="panel success-panel">
          <CheckCircle2 size={25} />
          <div><h2>Survey recorded: {result.score.toFixed(1)}</h2><p className="muted-copy">Overall interpretation: {result.interpretation}.</p></div>
        </section>
      )}
      <form className="sus-form" onSubmit={submit}>
        <div className="panel-heading">
          <span className="eyebrow">10 questions</span>
          <h2>Tell us how the registry felt to use</h2>
          <p className="muted-copy">Choose one response for every statement.</p>
        </div>
        {questions.map((question, index) => (
          <fieldset className="sus-question" key={question}>
            <legend><b>{index + 1}</b>{question}</legend>
            <div className="likert-scale">
              {scale.map((label, scaleIndex) => {
                const value = scaleIndex + 1;
                return (
                  <label key={label} title={label}>
                    <input type="radio" name={`sus-${index}`} value={value} checked={responses[index] === value} onChange={() => setResponses((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} />
                    <span>{value}</span>
                    <small>{scaleIndex === 0 || scaleIndex === 4 ? label : ""}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        {error && <p className="form-error">{error}</p>}
        <button className="btnp" disabled={busy}><Send size={18} />{busy ? "Submitting..." : "Submit survey"}</button>
      </form>
    </div>
  );
}
