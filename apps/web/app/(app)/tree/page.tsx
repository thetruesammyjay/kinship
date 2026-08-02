"use client";

import { GitBranch, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { FamilyTreeCanvas } from "@/components/family-tree/FamilyTreeCanvas";
import { apiRequest } from "@/lib/api";
import { SEED_FAMILY_ID } from "@/lib/constants";
import type { FamilyTreeRead } from "@/lib/types";

export default function FamilyTreePage() {
  const [tree, setTree] = useState<FamilyTreeRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<FamilyTreeRead>(`/families/${SEED_FAMILY_ID}/tree`)
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the family tree. Is the API running?");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">lineage map</span>
        <h1>Family tree</h1>
      </section>
      {error && <p className="form-error">{error}</p>}
      <FamilyTreeCanvas tree={tree} />
      <section className="two-column">
        <article className="panel pink-panel">
          <GitBranch size={24} />
          <h2>Relationship edges</h2>
          <p className="muted-copy">
            Parent-child links are stored as graph edges and traversed during verification.
          </p>
        </article>
        <article className="panel">
          <Layers3 size={24} />
          <h2>Graph persistence</h2>
          <p className="muted-copy">
            Postgres stores the vertices and edges while the API computes ancestry paths.
          </p>
        </article>
      </section>
    </div>
  );
}
