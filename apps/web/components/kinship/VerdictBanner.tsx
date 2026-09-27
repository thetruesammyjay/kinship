import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { KinshipVerifyResponse } from "@/lib/types";

type VerdictBannerProps = {
  result: KinshipVerifyResponse | null;
};

export function VerdictBanner({ result }: VerdictBannerProps) {
  if (!result) {
    return (
      <section className="verdict-card empty">
        <ShieldCheck size={24} />
        <span>No verdict yet</span>
      </section>
    );
  }

  const isClose = result.status === "Closely Related";
  const isSpouseRecord = result.relationship === "Spouses";
  const detail =
    result.degree != null
      ? `Computed degree ${result.degree}`
      : isSpouseRecord
        ? "Spouse link recorded; no blood degree inferred"
        : "No shared ancestor found in the recorded data";
  return (
    <section className={isClose ? "verdict-card risk" : "verdict-card"}>
      {isClose ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
      <div>
        <span>{isSpouseRecord ? "Spouse link recorded" : result.status}</span>
        <strong>{result.relationship}</strong>
        <small>{detail}</small>
      </div>
    </section>
  );
}
