import { ArrowDown } from "lucide-react";
import type { RelationshipPathStep } from "@/lib/types";

type RelationshipPathProps = {
  path: RelationshipPathStep[];
  emptyMessage?: string;
};

function linkLabel(relationship: string): string {
  switch (relationship) {
    case "Parent":
      return "Next person is the parent";
    case "Child":
      return "Next person is the child";
    default:
      return `${relationship} link`;
  }
}

export function RelationshipPath({ path, emptyMessage }: RelationshipPathProps) {
  if (path.length === 0) {
    return (
      <p className="path-empty">
        {emptyMessage ?? "Run a check to see the recorded connection path."}
      </p>
    );
  }

  return (
    <div className="path-strip">
      {path.map((step, index) => (
        <div className="path-segment" key={step.person_id}>
          <div className="path-person">
            <b>{String(index + 1).padStart(2, "0")}</b>
            <strong>{step.full_name}</strong>
          </div>
          {step.relationship_to_next && (
            <div className="path-connector">
              <span />
              <small>{linkLabel(step.relationship_to_next)}</small>
              <ArrowDown size={15} aria-hidden="true" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
