import { RelationshipEdge } from "./RelationshipEdge";
import { PersonNode } from "./PersonNode";

export function FamilyTreeCanvas() {
  return (
    <section className="tree-canvas" aria-label="Family tree visualization">
      <div className="tree-row centered">
        <PersonNode name="Nnamdi Worlu" label="Ancestor" tone="black" />
      </div>
      <RelationshipEdge label="CHILD_OF" />
      <div className="tree-row split">
        <PersonNode name="Adaeze Worlu" label="Parent A" tone="pink" />
        <PersonNode name="Chinedu Worlu" label="Parent B" />
      </div>
      <RelationshipEdge label="shared lineage" />
      <div className="tree-row split">
        <PersonNode name="Amara Worlu" label="Person A" />
        <PersonNode name="Tobechukwu Worlu" label="Person B" tone="pink" />
      </div>
    </section>
  );
}
