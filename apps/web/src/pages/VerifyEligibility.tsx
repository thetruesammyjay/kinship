import { RelationshipPath } from "../components/kinship/RelationshipPath";
import { VerdictBanner } from "../components/kinship/VerdictBanner";
import { VerificationForm } from "../components/kinship/VerificationForm";
import { useKinshipVerification } from "../hooks/useKinshipVerification";

export function VerifyEligibility() {
  const { result, runDemoVerification } = useKinshipVerification();

  return (
    <div className="verify-layout">
      <VerificationForm onVerify={runDemoVerification} />
      <div className="content-stack">
        <VerdictBanner result={result} />
        <section className="panel">
          <div className="panel-heading">
            <span className="eyebrow">relationship path</span>
            <h2>Explainable result</h2>
          </div>
          <RelationshipPath path={result?.path ?? []} />
          <p className="muted-copy">
            The API returns the verdict, computed degree, common ancestor, and path so reviewers can
            audit the result.
          </p>
        </section>
      </div>
    </div>
  );
}
