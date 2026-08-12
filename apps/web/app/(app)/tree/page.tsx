"use client";

import { GitBranch, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { FamilyTreeCanvas } from "@/components/family-tree/FamilyTreeCanvas";
import { FamilySelect } from "@/components/ui/FamilySelect";
import { apiRequest } from "@/lib/api";
import { filterTreeByFamily, loadRegistryData, type RegistryData } from "@/lib/registry";
import type { FamilyTreeRead } from "@/lib/types";

export default function FamilyTreePage() {
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [familyId, setFamilyId] = useState("");
  const [tree, setTree] = useState<FamilyTreeRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRegistryData()
      .then((data) => {
        if (cancelled) return;
        setRegistry(data);
        setFamilyId(data.families[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load families. Is the API running?");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!familyId || !registry) {
      setTree(null);
      return;
    }

    let cancelled = false;
    setTree(null);
    setError(null);
    apiRequest<FamilyTreeRead>(`/families/${familyId}/tree`)
      .then((data) => {
        if (!cancelled) setTree(filterTreeByFamily(data, registry.people, familyId));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the selected family tree.");
      });
    return () => {
      cancelled = true;
    };
  }, [familyId, registry]);

  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">lineage map</span>
        <h1>Family tree</h1>
      </section>
      <section className="panel family-filter-panel">
        <FamilySelect
          families={registry?.families ?? []}
          value={familyId}
          onChange={setFamilyId}
          disabled={!registry}
          label="View family"
        />
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
