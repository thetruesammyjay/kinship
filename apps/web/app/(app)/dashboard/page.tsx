"use client";

import { ArrowUpRight, MapPin, Network, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FamilyTreeCanvas } from "@/components/family-tree/FamilyTreeCanvas";
import { apiRequest } from "@/lib/api";
import { SEED_FAMILY_ID } from "@/lib/constants";
import type { FamilyTreeRead, PersonSearchResult } from "@/lib/types";

export default function DashboardPage() {
  const [people, setPeople] = useState<PersonSearchResult | null>(null);
  const [tree, setTree] = useState<FamilyTreeRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [peopleData, treeData] = await Promise.all([
          apiRequest<PersonSearchResult>("/persons/search"),
          apiRequest<FamilyTreeRead>(`/families/${SEED_FAMILY_ID}/tree`),
        ]);
        if (cancelled) return;
        setPeople(peopleData);
        setTree(treeData);
      } catch {
        if (!cancelled) setError("Could not load registry data. Is the API running?");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const communities = new Set(
    (people?.items ?? []).map((p) => p.origin_community).filter(Boolean),
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
          <strong>{people?.total ?? "—"}</strong>
          <span>registered people</span>
        </article>
        <article className="metric-card">
          <MapPin size={24} />
          <strong>{people ? communities.size : "—"}</strong>
          <span>communities covered</span>
        </article>
        <article className="metric-card dark">
          <Network size={24} />
          <strong>{tree?.edges.length ?? "—"}</strong>
          <span>graph edges</span>
        </article>
      </section>

      <FamilyTreeCanvas tree={tree} />
    </div>
  );
}
