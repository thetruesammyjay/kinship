import type { RelationshipPathStep } from "@/lib/types";

type RelationshipPathProps = {
  path: RelationshipPathStep[];
};

export function RelationshipPath({ path }: RelationshipPathProps) {
  const steps = path.length
    ? path.map((step) => step.full_name)
    : ["Select Person A", "Run verification", "Review path"];

  return (
    <div className="path-strip">
      {steps.map((step, index) => (
        <span key={`${index}-${step}`}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          {step}
        </span>
      ))}
    </div>
  );
}
