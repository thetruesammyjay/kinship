import { GitBranch, Layers3 } from "lucide-react";

import { FamilyTreeCanvas } from "../components/family-tree/FamilyTreeCanvas";

export function FamilyTreePage() {
  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">lineage map</span>
        <h1>Worlu family tree</h1>
      </section>
      <FamilyTreeCanvas />
      <section className="two-column">
        <article className="panel pink-panel">
          <GitBranch size={24} />
          <h2>Relationship edges</h2>
          <p>Parent-child links are stored as graph edges and traversed during verification.</p>
        </article>
        <article className="panel">
          <Layers3 size={24} />
          <h2>Graph persistence</h2>
          <p>Postgres stores the vertices and edges while the API computes ancestry paths.</p>
        </article>
      </section>
    </div>
  );
}
