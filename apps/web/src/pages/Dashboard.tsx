import { ArrowUpRight, MapPin, Network, ShieldCheck, UsersRound } from "lucide-react";

import { FamilyTreeCanvas } from "../components/family-tree/FamilyTreeCanvas";

export function Dashboard() {
  return (
    <div className="page-grid">
      <section className="hero-panel">
        <p className="eyebrow">graph-based kinship registry</p>
        <h1>Trace lineage before marriage decisions get complicated.</h1>
        <p>
          Search people, map family edges, and verify shared ancestry with a compact review
          workflow built for community registrars and elders.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <ShieldCheck size={18} />
            Verify eligibility
          </button>
          <button className="ghost-button">
            View records
            <ArrowUpRight size={18} />
          </button>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card pink">
          <UsersRound size={24} />
          <strong>100</strong>
          <span>seeded Igbo records</span>
        </article>
        <article className="metric-card">
          <MapPin size={24} />
          <strong>3</strong>
          <span>states covered</span>
        </article>
        <article className="metric-card dark">
          <Network size={24} />
          <strong>4</strong>
          <span>demo graph edges</span>
        </article>
      </section>

      <FamilyTreeCanvas />
    </div>
  );
}
