"use client";

import { HeartHandshake } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RelationshipPath } from "@/components/kinship/RelationshipPath";
import { VerdictBanner } from "@/components/kinship/VerdictBanner";
import { VerificationForm } from "@/components/kinship/VerificationForm";
import { apiRequest, ApiRequestError } from "@/lib/api";
import type {
  KinshipVerifyResponse,
  MarriageEligibilityResponse,
  PersonRead,
} from "@/lib/types";

export default function VerifyEligibilityPage() {
  const [result, setResult] = useState<KinshipVerifyResponse | null>(null);
  const [marriageResult, setMarriageResult] =
    useState<MarriageEligibilityResponse | null>(null);
  const [initialPeople, setInitialPeople] = useState<[PersonRead, PersonRead] | null>(null);
  const [busy, setBusy] = useState(false);
  const [marriageBusy, setMarriageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (personAId: string, personBId: string) => {
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
  }, []);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const personAId = params.get("person_a_id");
    const personBId = params.get("person_b_id");
    if (!personAId || !personBId) return;

    let active = true;
    Promise.all([
      apiRequest<PersonRead>(`/persons/${encodeURIComponent(personAId)}`),
      apiRequest<PersonRead>(`/persons/${encodeURIComponent(personBId)}`),
    ])
      .then(([personA, personB]) => {
        if (!active) return;
        setInitialPeople([personA, personB]);
        void verify(personA.id, personB.id);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof ApiRequestError
            ? `Could not load the people selected from the family tree. ${caught.message}`
            : "Could not load the people selected from the family tree.",
        );
      });

    return () => {
      active = false;
    };
  }, [verify]);

  return (
    <div className="verify-layout">
      <VerificationForm
        onVerify={verify}
        onMarriageCheck={checkMarriage}
        initialPeople={initialPeople}
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
            <h2>Recorded connection path</h2>
          </div>
          <RelationshipPath
            path={marriageResult?.path ?? result?.path ?? []}
            emptyMessage={
              result || marriageResult
                ? "No recorded connection path was found. Check the explanation below."
                : "Choose two people and run a check to see their recorded path."
            }
          />
          <p className="muted-copy">
            {marriageResult?.message ?? result?.message ??
              "The API returns the verdict, computed degree, common ancestor, and path so reviewers can audit the result."}
          </p>
        </section>
      </div>
    </div>
  );
}
