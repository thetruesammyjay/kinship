"use client";

import { ArrowUpRight, MapPin, Network, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FamilyTreeCanvas } from "@/components/family-tree/FamilyTreeCanvas";
import { FamilySelect } from "@/components/ui/FamilySelect";
import { apiRequest } from "@/lib/api";
import { filterTreeByFamily, loadRegistryData, type RegistryData } from "@/lib/registry";
import type { FamilyTreeRead } from "@/lib/types";

export default function DashboardPage() {
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
        if (!cancelled) setError("Could not load registry data. Is the API running?");
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
        if (!cancelled) setError("Could not load this family tree.");
      });
    return () => {
      cancelled = true;
    };
  }, [familyId, registry]);

  const selectedPeople = (registry?.people ?? []).filter(
    (person) => person.family_id === familyId,
  );
  const communities = new Set(
    selectedPeople.map((person) => person.origin_community).filter(Boolean),
  );

  return (
    <div className="content-stack">
      <section className="panel">
        <span className="eyebrow">graph-based kinship registry</span>
        <h2>Trace lineage before marriage decisions get complicated.</h2>
        <p className="muted-copy">
          Search people, map family edges, and verify shared ancestry with a compact review
          workflow built for community registrars and elders.
        </p>
        <FamilySelect
          families={registry?.families ?? []}
          value={familyId}
          onChange={setFamilyId}
          disabled={!registry}
          label="Review family"
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btnp" href="/verify">
            <ShieldCheck size={18} />
            Verify eligibility
          </Link>
          <Link className="btng" href="/tree">
            View records
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="metric-grid">
        <article className="metric-card pink">
          <UsersRound size={24} />
          <strong>{registry ? selectedPeople.length : "-"}</strong>
          <span>people in this family</span>
        </article>
        <article className="metric-card">
          <MapPin size={24} />
          <strong>{registry ? communities.size : "-"}</strong>
          <span>communities covered</span>
        </article>
        <article className="metric-card dark">
          <Network size={24} />
          <strong>{tree?.edges.length ?? "-"}</strong>
          <span>graph edges</span>
        </article>
      </section>

      <FamilyTreeCanvas tree={tree} />
    </div>
  );
}
