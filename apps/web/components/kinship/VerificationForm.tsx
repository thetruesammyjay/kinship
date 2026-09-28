"use client";

import { ArrowRightLeft, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { PersonPicker } from "@/components/ui/PersonPicker";
import type { PersonRead } from "@/lib/types";

type VerificationFormProps = {
  onVerify: (personAId: string, personBId: string) => void;
  onMarriageCheck: (personAId: string, personBId: string) => void;
  initialPeople?: [PersonRead, PersonRead] | null;
  busy?: boolean;
  marriageBusy?: boolean;
};

export function VerificationForm({
  onVerify,
  onMarriageCheck,
  initialPeople = null,
  busy,
  marriageBusy,
}: VerificationFormProps) {
  const [personA, setPersonA] = useState<PersonRead | null>(null);
  const [personB, setPersonB] = useState<PersonRead | null>(null);

  useEffect(() => {
    if (!initialPeople) return;
    setPersonA(initialPeople[0]);
    setPersonB(initialPeople[1]);
  }, [initialPeople]);

  return (
    <section className="panel">
      <div className="panel-heading">
        <span className="eyebrow">eligibility check</span>
        <h2>Compare two lineage records</h2>
      </div>
      {initialPeople && (
        <p className="verification-source-note" role="status">
          Pair loaded from the selected family-tree connection.
        </p>
      )}
      <PersonPicker label="Person A" value={personA} onChange={setPersonA} />
      <button
        className="swap-button"
        type="button"
        aria-label="Swap selected people"
        onClick={() => {
          setPersonA(personB);
          setPersonB(personA);
        }}
      >
        <ArrowRightLeft size={18} />
      </button>
      <PersonPicker label="Person B" value={personB} onChange={setPersonB} />
      <button
        className="btnp full"
        type="button"
        disabled={!personA || !personB || busy}
        onClick={() => personA && personB && onVerify(personA.id, personB.id)}
      >
        <Play size={18} />
        {busy ? "Checking..." : "Run check"}
      </button>
      <button
        className="btng full"
        type="button"
        disabled={!personA || !personB || marriageBusy}
        onClick={() =>
          personA && personB && onMarriageCheck(personA.id, personB.id)
        }
      >
        {marriageBusy ? "Checking eligibility..." : "Check marriage eligibility"}
      </button>
    </section>
  );
}
