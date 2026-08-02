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
  return (
    <section className={isClose ? "verdict-card risk" : "verdict-card"}>
      {isClose ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
      <div>
        <span>{result.status}</span>
        <strong>{result.degree != null ? `Degree ${result.degree}` : "No degree"}</strong>
      </div>
    </section>
  );
}
