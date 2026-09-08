"use client";

import { HeartHandshake } from "lucide-react";
import { useState } from "react";
import { RelationshipPath } from "@/components/kinship/RelationshipPath";
import { VerdictBanner } from "@/components/kinship/VerdictBanner";
import { VerificationForm } from "@/components/kinship/VerificationForm";
import { apiRequest, ApiRequestError } from "@/lib/api";
import type {
  KinshipVerifyResponse,
  MarriageEligibilityResponse,
} from "@/lib/types";

export default function VerifyEligibilityPage() {
  const [result, setResult] = useState<KinshipVerifyResponse | null>(null);
  const [marriageResult, setMarriageResult] =
    useState<MarriageEligibilityResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [marriageBusy, setMarriageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(personAId: string, personBId: string) {
    setBusy(true);
    setError(null);
    try {
      const data = await apiRequest<KinshipVerifyResponse>("/kinship/verify", {
        method: "POST",
        body: JSON.stringify({ person_a_id: personAId, person_b_id: personBId }),
      });
      setResult(data);
      setMarriageResult(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Verification request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function checkMarriage(personAId: string, personBId: string) {
    setMarriageBusy(true);
    setError(null);
    try {
      const data = await apiRequest<MarriageEligibilityResponse>(
        "/kinship/marriage-eligibility",
        {
          method: "POST",
          body: JSON.stringify({ person_a_id: personAId, person_b_id: personBId }),
        },
      );
      setMarriageResult(data);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Marriage eligibility request failed.",
      );
    } finally {
      setMarriageBusy(false);
    }
  }

  return (
    <div className="verify-layout">
      <VerificationForm
        onVerify={verify}
        onMarriageCheck={checkMarriage}
        busy={busy}
        marriageBusy={marriageBusy}
      />
      <div className="content-stack">
        <VerdictBanner result={result} />
        {marriageResult && (
          <section
            className={
              "panel marriage-result " +
              (marriageResult.can_marry ? "allowed" : "blocked")
            }
          >
            <div className="panel-heading">
              <HeartHandshake size={22} />
              <span className="eyebrow">marriage eligibility</span>
              <h2>{marriageResult.decision}</h2>
            </div>
            <strong>{marriageResult.relationship}</strong>
            <p className="muted-copy">{marriageResult.message}</p>
          </section>
        )}
        {error && <p className="form-error">{error}</p>}
        <section className="panel">
          <div className="panel-heading">
            <span className="eyebrow">relationship path</span>
            <h2>Explainable result</h2>
          </div>
          <RelationshipPath path={result?.path ?? []} />
          <p className="muted-copy">
            {result?.message ??
              "The API returns the verdict, computed degree, common ancestor, and path so reviewers can audit the result."}
          </p>
        </section>
      </div>
    </div>
  );
}